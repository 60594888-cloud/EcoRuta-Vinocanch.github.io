"""EcoRuta Vinocanchón: servidor de demostración con SQLite compartido.
Ejecutar: python server.py | Crear admin: python server.py create-admin
"""
import base64, hashlib, hmac, json, mimetypes, os, secrets, sqlite3, sys, time
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from getpass import getpass

ROOT = Path(__file__).parent.resolve()
PUBLIC = ROOT / 'public'
DB = Path(os.environ.get('ECORUTA_DB', str(ROOT / 'ecoruta.db')))
HOST = os.environ.get('ECORUTA_HOST', '127.0.0.1')
PORT = int(os.environ.get('ECORUTA_PORT', '8000'))
SECTORS = ('Verduras', 'Carnes', 'Frutas', 'Comidas', 'Abarrotes')
REWARDS = [('Insignia EcoVecino', 20), ('Bolsa reutilizable', 50), ('Kit ecológico', 100), ('Reconocimiento especial', 180)]

def conn():
    c = sqlite3.connect(DB, timeout=10)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    c.execute('PRAGMA busy_timeout=10000')
    return c

def init():
    with conn() as c:
        c.execute('PRAGMA journal_mode=WAL')
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')), points INTEGER NOT NULL DEFAULT 0 CHECK(points>=0), created TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), sector TEXT NOT NULL, kind TEXT NOT NULL, urgency TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','resolved')), created TEXT NOT NULL, validated_by INTEGER REFERENCES users(id), awarded INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS redemptions(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), reward TEXT NOT NULL, cost INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','delivered')), created TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_reports_sector_status ON reports(sector,status);
        CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
        ''')

def hash_pw(pw, salt):
    return hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1).hex()

def utc(): return datetime.now(timezone.utc).isoformat(timespec='seconds')

def create_admin():
    email = input('Correo del administrador: ').strip().lower()
    name = input('Nombre: ').strip()
    pw = getpass('Contraseña (mínimo 12 caracteres): ')
    if len(pw)<12 or not name or '@' not in email: sys.exit('Datos inválidos.')
    salt=secrets.token_hex(16)
    with conn() as c:
        c.execute('INSERT INTO users(name,email,salt,password,role,created) VALUES(?,?,?,?,?,?)',(name,email,salt,hash_pw(pw,salt),'admin',utc()))
    print('Administrador creado. No compartas esta contraseña.')

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print('%s - %s' % (self.address_string(), fmt % args))

    def respond(self, code, data, cookie=None):
        body=json.dumps(data,ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        if cookie: self.send_header('Set-Cookie',cookie)
        self.send_header('Content-Length',str(len(body)))
        self.end_headers(); self.wfile.write(body)

    def body(self):
        size=int(self.headers.get('Content-Length','0'))
        if size>15000: raise ValueError('Solicitud demasiado grande')
        obj=json.loads(self.rfile.read(size) or b'{}')
        if not isinstance(obj,dict): raise ValueError('JSON inválido')
        return obj

    def session(self):
        cookie=SimpleCookie()
        try: cookie.load(self.headers.get('Cookie',''))
        except Exception: return None
        if 'ecoruta_session' not in cookie: return None
        token=cookie['ecoruta_session'].value
        with conn() as c:
            row=c.execute('SELECT u.id,u.name,u.email,u.role,u.points,s.csrf FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?',(hashlib.sha256(token.encode()).hexdigest(),int(time.time()))).fetchone()
            return dict(row) if row else None

    def require(self, admin=False, write=False):
        user=self.session()
        if not user: self.respond(401,{'error':'Inicia sesión'}); return None
        if admin and user['role']!='admin': self.respond(403,{'error':'Acceso reservado al administrador'}); return None
        if write and not hmac.compare_digest(self.headers.get('X-CSRF-Token',''),user['csrf']):
            self.respond(403,{'error':'Token de seguridad inválido'}); return None
        return user

    def do_GET(self):
        path=urlsplit(self.path).path
        if path.startswith('/api/'):
            try: self.api_get(path)
            except Exception as e: self.respond(500,{'error':'Error interno'}); print('GET ERROR',repr(e))
            return
        if path=='/': path='/index.html'
        target=(PUBLIC/path.lstrip('/')).resolve()
        if not target.is_relative_to(PUBLIC) or not target.is_file(): self.send_error(404); return
        data=target.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type',mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Length',str(len(data)))
        self.end_headers(); self.wfile.write(data)

    def api_get(self,path):
        if path=='/api/me':
            u=self.session(); self.respond(200,{'user':u}); return
        u=self.require()
        if not u:return
        with conn() as c:
            if path=='/api/dashboard':
                rows=[dict(x) for x in c.execute("SELECT sector,urgency,status FROM reports WHERE status IN ('pending','approved')")]
                all_count=c.execute('SELECT count(*) FROM reports').fetchone()[0]
                resolved=c.execute("SELECT count(*) FROM reports WHERE status='resolved'").fetchone()[0]
                self.respond(200,{'sectors':list(SECTORS),'heat':rows,'total':all_count,'resolved':resolved,'rewards':[{'name':n,'cost':cost} for n,cost in REWARDS]}); return
            if path=='/api/reports':
                if u['role']=='admin':
                    sql='SELECT r.*,u.name AS author FROM reports r JOIN users u ON u.id=r.user_id ORDER BY r.id DESC LIMIT 250'; args=()
                else:
                    sql='SELECT r.*,u.name AS author FROM reports r JOIN users u ON u.id=r.user_id WHERE r.user_id=? ORDER BY r.id DESC LIMIT 250'; args=(u['id'],)
                self.respond(200,{'reports':[dict(x) for x in c.execute(sql,args)]}); return
            if path=='/api/redemptions':
                if u['role']=='admin':
                    sql='SELECT d.*,u.name AS author FROM redemptions d JOIN users u ON u.id=d.user_id ORDER BY d.id DESC LIMIT 200'; args=()
                else:
                    sql='SELECT d.*,u.name AS author FROM redemptions d JOIN users u ON u.id=d.user_id WHERE user_id=? ORDER BY d.id DESC LIMIT 200'; args=(u['id'],)
                self.respond(200,{'redemptions':[dict(x) for x in c.execute(sql,args)]}); return
        self.respond(404,{'error':'Ruta no encontrada'})

    def do_POST(self):
        path=urlsplit(self.path).path
        try:
            data=self.body()
            self.api_post(path,data)
        except (ValueError, json.JSONDecodeError) as e: self.respond(400,{'error':str(e)})
        except sqlite3.IntegrityError: self.respond(409,{'error':'El correo ya existe o los datos son inválidos'})
        except Exception as e: self.respond(500,{'error':'Error interno'}); print('POST ERROR',repr(e))

    def api_post(self,path,d):
        if path in ('/api/register','/api/login'):
            email=str(d.get('email','')).strip().lower()
            pw=str(d.get('password',''))
            if len(email)>150 or '@' not in email or not 8<=len(pw)<=128: raise ValueError('Correo o contraseña inválidos (mínimo 8 caracteres)')
            with conn() as c:
                if path=='/api/register':
                    name=str(d.get('name','')).strip()
                    if not 2<=len(name)<=70: raise ValueError('Nombre inválido')
                    salt=secrets.token_hex(16)
                    c.execute('INSERT INTO users(name,email,salt,password,created) VALUES(?,?,?,?,?)',(name,email,salt,hash_pw(pw,salt),utc()))
                row=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
                if not row or not hmac.compare_digest(hash_pw(pw,row['salt']),row['password']):
                    self.respond(401,{'error':'Credenciales incorrectas'});return
                token=secrets.token_urlsafe(32); csrf=secrets.token_urlsafe(32)
                c.execute('INSERT INTO sessions(token_hash,user_id,csrf,expires) VALUES(?,?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),row['id'],csrf,int(time.time())+86400))
            self.respond(200,{'ok':True},f'ecoruta_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400');return
        u=self.require(admin=path.startswith('/api/admin/'),write=True)
        if not u:return
        with conn() as c:
            if path=='/api/logout':
                cookie=SimpleCookie(); cookie.load(self.headers.get('Cookie',''))
                if 'ecoruta_session' in cookie:
                    c.execute('DELETE FROM sessions WHERE token_hash=?',(hashlib.sha256(cookie['ecoruta_session'].value.encode()).hexdigest(),))
                self.respond(200,{'ok':True},'ecoruta_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return
            if path=='/api/reports':
                sector=d.get('sector');kind=d.get('kind');urgency=d.get('urgency');desc=str(d.get('description','')).strip()
                if sector not in SECTORS or kind not in ('Orgánico','Plástico','Papel y cartón','Vidrio','Mixto') or urgency not in ('bajo','medio','alto') or len(desc)>500: raise ValueError('Revisa los campos del reporte')
                c.execute('INSERT INTO reports(user_id,sector,kind,urgency,description,created) VALUES(?,?,?,?,?,?)',(u['id'],sector,kind,urgency,desc,utc()))
                self.respond(201,{'ok':True,'message':'Reporte enviado para validación'});return
            if path=='/api/admin/validate':
                rid=int(d.get('id',0)); action=d.get('action')
                row=c.execute('SELECT * FROM reports WHERE id=?',(rid,)).fetchone()
                if not row: self.respond(404,{'error':'Reporte no encontrado'});return
                if action=='approve' and row['status']=='pending': new='approved'
                elif action=='reject' and row['status']=='pending': new='rejected'
                elif action=='resolve' and row['status']=='approved': new='resolved'
                else: self.respond(409,{'error':'Transición de estado no permitida'});return
                c.execute('UPDATE reports SET status=?,validated_by=? WHERE id=?',(new,u['id'],rid))
                if new=='resolved' and not row['awarded']:
                    c.execute('UPDATE users SET points=points+5 WHERE id=?',(row['user_id'],))
                    c.execute('UPDATE reports SET awarded=1 WHERE id=?',(rid,))
                self.respond(200,{'ok':True});return
            if path=='/api/redeem':
                name=str(d.get('reward',''))
                rewards=dict(REWARDS)
                if name not in rewards: raise ValueError('Recompensa inválida')
                cost=rewards[name]
                cur=c.execute('UPDATE users SET points=points-? WHERE id=? AND points>=?', (cost,u['id'],cost))
                if cur.rowcount==0: self.respond(409,{'error':'No tienes suficientes EcoPuntos'});return
                c.execute('INSERT INTO redemptions(user_id,reward,cost,created) VALUES(?,?,?,?)',(u['id'],name,cost,utc()))
                self.respond(201,{'ok':True,'message':'Canje solicitado. Entrega pendiente de confirmación.'});return
            if path=='/api/admin/deliver':
                rid=int(d.get('id',0))
                cur=c.execute("UPDATE redemptions SET status='delivered' WHERE id=? AND status='requested'",(rid,))
                if not cur.rowcount:self.respond(409,{'error':'Canje no disponible'});return
                self.respond(200,{'ok':True});return
        self.respond(404,{'error':'Ruta no encontrada'})

if __name__=='__main__':
    init()
    if len(sys.argv)>1 and sys.argv[1]=='create-admin':create_admin()
    else:
        print(f'EcoRuta disponible en http://{HOST}:{PORT} | Ctrl+C para detener')
        ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
