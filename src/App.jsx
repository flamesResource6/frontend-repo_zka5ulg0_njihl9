import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom'
import { Home, Newspaper, Megaphone, Images, School, CalendarDays, CalendarClock, Users, ListTree, Trophy, LogOut } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [email, setEmail] = useState(localStorage.getItem('email') || '')
  const save = (t, e) => { localStorage.setItem('token', t); localStorage.setItem('email', e); setToken(t); setEmail(e) }
  const clear = () => { localStorage.removeItem('token'); localStorage.removeItem('email'); setToken(''); setEmail('') }
  return { token, email, save, clear }
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'auth-token': token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function Layout({ children }) {
  const navItem = (to, label, Icon) => (
    <NavLink to={to} className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-50 ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}>
      <Icon size={18} /> {label}
    </NavLink>
  )
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-blue-700">Manajemen Sekolah</Link>
          <nav className="hidden md:flex gap-2">
            {navItem('/', 'Beranda', Home)}
            {navItem('/berita', 'Berita & Artikel', Newspaper)}
            {navItem('/pengumuman', 'Pengumuman', Megaphone)}
            {navItem('/galeri', 'Galeri', Images)}
            {navItem('/ppdb', 'PPDB', School)}
            {navItem('/kalender', 'Kalender Akademik', CalendarDays)}
            {navItem('/jadwal', 'Jadwal Sekolah', CalendarClock)}
            {navItem('/organisasi', 'Struktur Organisasi', ListTree)}
            {navItem('/sdm', 'SDM', Users)}
            {navItem('/ekskul', 'Ekstrakurikuler', Trophy)}
            {navItem('/profil', 'Profil Sekolah', School)}
            {navItem('/prestasi', 'Galeri Prestasi', Trophy)}
            {navItem('/admin', 'Admin', Users)}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-500">© {new Date().getFullYear()} Manajemen Sekolah</div>
      </footer>
    </div>
  )
}

function Section({ title, children, action }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        {action}
      </div>
      <div className="bg-white border rounded-lg p-4">{children}</div>
    </section>
  )
}

function HomePage() {
  const [news, setNews] = useState([])
  const [ann, setAnn] = useState([])
  useEffect(()=>{ (async()=>{
    setNews(await api('/public/newsarticle?limit=6'))
    setAnn(await api('/public/announcement?limit=6'))
  })() },[])
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Section title="Berita Terbaru">
          <div className="grid sm:grid-cols-2 gap-4">
            {news.map(n=> (
              <div key={n._id} className="border rounded-md p-3">
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{n.content}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <div>
        <Section title="Pengumuman">
          <ul className="space-y-2">
            {ann.map(a=> (<li key={a._id} className="text-sm"><span className="font-medium">{a.title}</span> — {a.content}</li>))}
          </ul>
        </Section>
      </div>
    </div>
  )
}

function ListPublic({ col, title }) {
  const [items, setItems] = useState([])
  useEffect(()=>{ (async()=> setItems(await api(`/public/${col}`)))() },[col])
  return (
    <Section title={title}>
      <div className="space-y-3">
        {items.map(it => (
          <div key={it._id} className="border rounded-md p-3">
            {it.title && <h3 className="font-semibold">{it.title}</h3>}
            {it.content && <p className="text-gray-600 text-sm">{it.content}</p>}
            {it.image_url && <img src={it.image_url} className="mt-2 rounded" />}
          </div>
        ))}
      </div>
    </Section>
  )
}

function ProfilePages() {
  const keys = [
    { key: 'sejarah', label: 'Sejarah' },
    { key: 'visi_misi', label: 'Visi & Misi' },
    { key: 'fasilitas', label: 'Fasilitas' },
    { key: 'kontak_alamat', label: 'Kontak & Alamat' },
  ]
  const [data, setData] = useState({})
  useEffect(()=>{ (async()=>{
    const res = {}
    for (const k of keys) res[k.key] = await api(`/public/page/${k.key}`)
    setData(res)
  })() },[])
  return (
    <Section title="Profil Sekolah">
      <div className="space-y-4">
        {keys.map(k => (
          <div key={k.key}>
            <h3 className="font-semibold mb-1">{k.label}</h3>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{__html: data[k.key]?.content || ''}} />
          </div>
        ))}
      </div>
    </Section>
  )
}

function Admin() {
  const { token, email, save, clear } = useAuth()
  const [loginEmail, setLoginEmail] = useState('')
  const [activeTab, setActiveTab] = useState('newsarticle')
  const [items, setItems] = useState([])
  const [form, setForm] = useState({})

  const navigate = useNavigate()

  const collections = [
    ['newsarticle','Berita & Artikel'],
    ['announcement','Pengumuman'],
    ['galleryitem','Galeri'],
    ['admissioninfo','PPDB'],
    ['academiccalendarevent','Kalender Akademik'],
    ['scheduleentry','Jadwal Sekolah'],
    ['orgnode','Bagan Organisasi'],
    ['staff','SDM'],
    ['extracurricular','Ekstrakurikuler'],
    ['schoolpage','Profil Halaman'],
    ['achievement','Galeri Prestasi'],
  ]

  useEffect(()=>{ if(token){ loadData() } }, [activeTab, token])

  async function loadData(){
    const res = await api(`/admin/${activeTab}`, { token })
    setItems(res)
  }

  async function doLogin(e){
    e.preventDefault()
    try {
      const res = await api('/auth/login', { method: 'POST', body: { email: loginEmail } })
      save(res.token, res.email)
    } catch(err){ alert('Login gagal: hanya Admin Master yang diizinkan') }
  }

  function onEdit(item){ setForm(item); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  async function onSubmit(e){
    e.preventDefault()
    const payload = { data: form }
    if(form._id){
      await api(`/admin/${activeTab}/${form._id}`, { method: 'PUT', token, body: payload })
    } else {
      await api(`/admin/${activeTab}`, { method: 'POST', token, body: payload })
    }
    setForm({})
    loadData()
  }

  async function onDelete(id){
    if(!confirm('Hapus data ini?')) return
    await api(`/admin/${activeTab}/${id}`, { method: 'DELETE', token })
    loadData()
  }

  function logout(){
    api('/auth/logout', { method: 'POST', token }).finally(()=>{ clear(); navigate('/') })
  }

  if(!token){
    return (
      <Section title="Login Admin" action={null}>
        <form onSubmit={doLogin} className="space-y-3 max-w-sm">
          <input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} type="email" placeholder="Email admin" className="w-full border rounded px-3 py-2" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Masuk</button>
          <p className="text-xs text-gray-500">Gunakan email Admin Master untuk mengelola semua data.</p>
        </form>
      </Section>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Panel Admin</h2>
        <button onClick={logout} className="inline-flex items-center gap-2 text-red-600 border px-3 py-1.5 rounded"><LogOut size={16}/> Logout</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {collections.map(([key, label]) => (
          <button key={key} onClick={()=>setActiveTab(key)} className={`px-3 py-1.5 rounded border ${activeTab===key? 'bg-blue-600 text-white border-blue-600':'bg-white'}`}>{label}</button>
        ))}
      </div>

      <Section title={`Kelola: ${collections.find(c=>c[0]===activeTab)?.[1]}`}>
        <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-3">
          {Object.keys(form).length===0 && <p className="text-sm text-gray-500 md:col-span-2">Tambah data baru atau klik item untuk mengedit.</p>}
          <textarea value={form.title||''} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Judul / Nama" className="border rounded px-3 py-2 md:col-span-2" />
          <textarea value={form.content||''} onChange={e=>setForm({...form, content:e.target.value})} placeholder="Konten / Deskripsi (HTML diperbolehkan)" rows={6} className="border rounded px-3 py-2 md:col-span-2" />
          <input value={form.image_url||''} onChange={e=>setForm({...form, image_url:e.target.value})} placeholder="URL Gambar" className="border rounded px-3 py-2" />
          <input value={form.category||''} onChange={e=>setForm({...form, category:e.target.value})} placeholder="Kategori / Tipe" className="border rounded px-3 py-2" />
          <input value={form.date||''} onChange={e=>setForm({...form, date:e.target.value})} placeholder="Tanggal (opsional)" className="border rounded px-3 py-2" />
          <div className="md:col-span-2 flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button>
            <button type="button" onClick={()=>setForm({})} className="border px-4 py-2 rounded">Reset</button>
          </div>
        </form>
      </Section>

      <Section title="Data">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(it => (
            <div key={it._id} className="border rounded p-3">
              <div className="font-medium">{it.title || it.name || it.key || 'Item'}</div>
              <div className="text-xs text-gray-500 break-words line-clamp-3">{it.content}</div>
              {it.image_url && <img src={it.image_url} className="mt-2 rounded" />}
              <div className="flex gap-2 mt-3">
                <button onClick={()=>onEdit(it)} className="px-3 py-1 rounded border">Edit</button>
                <button onClick={()=>onDelete(it._id)} className="px-3 py-1 rounded border text-red-600">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

export default function App(){
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/berita" element={<ListPublic col="newsarticle" title="Berita & Artikel"/>} />
          <Route path="/pengumuman" element={<ListPublic col="announcement" title="Pengumuman"/>} />
          <Route path="/galeri" element={<ListPublic col="galleryitem" title="Galeri"/>} />
          <Route path="/ppdb" element={<ListPublic col="admissioninfo" title="PPDB"/>} />
          <Route path="/kalender" element={<ListPublic col="academiccalendarevent" title="Kalender Akademik"/>} />
          <Route path="/jadwal" element={<ListPublic col="scheduleentry" title="Jadwal Sekolah"/>} />
          <Route path="/organisasi" element={<ListPublic col="orgnode" title="Struktur Organisasi (Bagan)"/>} />
          <Route path="/sdm" element={<ListPublic col="staff" title="SDM"/>} />
          <Route path="/ekskul" element={<ListPublic col="extracurricular" title="Ekstrakurikuler"/>} />
          <Route path="/profil" element={<ProfilePages/>} />
          <Route path="/prestasi" element={<ListPublic col="achievement" title="Galeri Prestasi"/>} />
          <Route path="/admin" element={<Admin/>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
