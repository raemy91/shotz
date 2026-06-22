import React, { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Film, Plus, Search, Download, Upload, Play, Share2, X, Check,
  ChevronLeft, ChevronRight, Edit3, Camera, Plane, Box,
  Mic, User, MapPin, Clock, MessageSquare, FileText, LayoutGrid,
  List, Send, Eye, Users, Aperture, Trash2, Pencil, Printer
} from "lucide-react";

// ====== SUPABASE INSTELLINGEN ======
// Je URL staat hieronder al ingevuld.
// Vul bij SUPABASE_KEY je eigen "anon public" key in (tussen de aanhalingstekens).
const SUPABASE_URL = "https://suxhjxcrgnootnlhdjcx.supabase.co";
const SUPABASE_KEY = "PLAK_HIER_JE_ANON_PUBLIC_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// ===================================

const BLUE = "#0F9FEC";
const DARK = "#0A0A0A";
const GREEN = "#22C55E";
const ORANGE = "#F59E0B";
const RED = "#EF4444";
const GRAY = "#9CA3AF";

const SHOT_SIZES = ["Extreme Wide Shot","Wide Shot","Medium Wide Shot","Medium Shot","Medium Close-Up","Close-Up","Extreme Close-Up"];
const SHOT_TYPES = ["Single","Two Shot","Over The Shoulder","POV","Insert","Detail","Establishing Shot","Drone Shot","Product Shot","Interview","B-roll"];
const MOVEMENTS = ["Static","Pan","Tilt","Push In","Pull Out","Tracking","Handheld","Gimbal","Drone","Slider","Orbit"];
const INOUT = ["Binnen","Buiten","Binnen + Buiten"];
const LENSES = ["16mm","24mm","35mm","50mm","85mm","100mm Macro","Zoom lens","Drone camera"];
const STATUSES = ["Niet klaar","Klaar"];
const ROLES = ["Owner","Crew","Client","Viewer"];

function nextShotNumber(shots) {
  return shots.length ? Math.max(...shots.map(s => s.num)) + 1 : 1;
}

function slugify(name) {
  return (name || "project")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
}

function shotIcon(type) {
  if (type === "Drone Shot") return Plane;
  if (type === "Product Shot" || type === "Detail" || type === "Insert") return Box;
  if (type === "Interview") return Mic;
  if (type === "Establishing Shot") return MapPin;
  return Camera;
}

const INITIAL_PROJECTS = [
  { id: "p1", name: "Commercial Supercleaners", client: "Supercleaners", date: "2026-06-24", status: "In productie", shots: 10 },
  { id: "p2", name: "Brandfilm Grow by Visuals", client: "Grow by Visuals", date: "2026-07-02", status: "Gepland", shots: 0 },
  { id: "p3", name: "Music Video Cairo", client: "CUZZO Films", date: "2026-07-10", status: "Concept", shots: 0 },
  { id: "p4", name: "Wedding Film", client: "Particulier", date: "2026-08-15", status: "Gepland", shots: 0 },
];

const PROJECT_STATUSES = ["Concept", "Gepland", "In productie", "Afgerond"];

const initialShots = [
  { id:1, num:1, scene:"1", subject:"Badkamer Marco", desc:"Establishing shot van de badkamer, Marco kijkt vol trots naar zijn schone tegels", size:"Wide Shot", type:"Establishing Shot", location:"Badkamer interieur", movement:"Static", lens:"24mm", inout:"Binnen", prep:15, start:"09:00", end:"09:20", people:1, props:"Supercleaners fles, spons", dialog:"VO: Een schone badkamer begint hier.", status:"Klaar", img:null, comments:[{role:"Client", text:"Kunnen we deze ook iets lichter belichten?"}] },
  { id:2, num:2, scene:"1", subject:"Handen + fles", desc:"Close-up van handen die de Supercleaners fles oppakken", size:"Close-Up", type:"Detail", location:"Badkamer interieur", movement:"Static", lens:"85mm", inout:"Binnen", prep:10, start:"09:20", end:"09:35", people:1, props:"Supercleaners fles", dialog:"", status:"Klaar", img:null, comments:[] },
  { id:3, num:3, scene:"1", subject:"Marco spuit", desc:"Medium shot Marco spuit het product op de tegels", size:"Medium Shot", type:"Single", location:"Badkamer interieur", movement:"Push In", lens:"35mm", inout:"Binnen", prep:10, start:"09:35", end:"10:00", people:1, props:"Supercleaners fles", dialog:"Marco: Kijk dit eens!", status:"Niet klaar", img:null, comments:[{role:"Crew", text:"Let op reflectie in de spiegel."}] },
  { id:4, num:4, scene:"2", subject:"Daan komt binnen", desc:"Tracking shot Daan loopt jaloers de badkamer in", size:"Medium Wide Shot", type:"Two Shot", location:"Gang / badkamer", movement:"Tracking", lens:"24mm", inout:"Binnen", prep:20, start:"10:00", end:"10:40", people:2, props:"", dialog:"Daan: Hoe krijg jij dat zo schoon?", status:"Niet klaar", img:null, comments:[] },
  { id:5, num:5, scene:"2", subject:"Buurtuin", desc:"Drone shot van de twee tuinen naast elkaar", size:"Extreme Wide Shot", type:"Drone Shot", location:"Achtertuinen", movement:"Drone", lens:"Drone camera", inout:"Buiten", prep:25, start:"10:40", end:"11:10", people:2, props:"Drone", dialog:"", status:"Niet klaar", img:null, comments:[{role:"Client", text:"Mooi! Mag dit ook bij zonsondergang?"}] },
  { id:6, num:6, scene:"2", subject:"Marco interview", desc:"Interview setup Marco vertelt over het product", size:"Medium Close-Up", type:"Interview", location:"Woonkamer", movement:"Static", lens:"50mm", inout:"Binnen", prep:30, start:"11:10", end:"11:45", people:1, props:"Stoel, microfoon", dialog:"Marco: Sinds Supercleaners is alles anders.", status:"Niet klaar", img:null, comments:[] },
  { id:7, num:7, scene:"3", subject:"Product op aanrecht", desc:"Product detail shot van de fles met mooie belichting", size:"Close-Up", type:"Product Shot", location:"Keuken set", movement:"Slider", lens:"100mm Macro", inout:"Binnen", prep:20, start:"11:45", end:"12:15", people:0, props:"Supercleaners fles, lampen", dialog:"", status:"Niet klaar", img:null, comments:[] },
  { id:8, num:8, scene:"3", subject:"Buren samen", desc:"Team / buren lopen samen door de tuin, lachend", size:"Wide Shot", type:"Two Shot", location:"Achtertuinen", movement:"Gimbal", lens:"35mm", inout:"Buiten", prep:15, start:"13:00", end:"13:30", people:2, props:"", dialog:"", status:"Niet klaar", img:null, comments:[] },
  { id:9, num:9, scene:"4", subject:"Vieze tegel (before)", desc:"Before shot van de vieze situatie voor de transformatie", size:"Medium Close-Up", type:"Insert", location:"Badkamer interieur", movement:"Static", lens:"50mm", inout:"Binnen", prep:10, start:"13:30", end:"13:45", people:0, props:"Vuil/props", dialog:"", status:"Niet klaar", img:null, comments:[] },
  { id:10, num:10, scene:"4", subject:"Schone tegel (after)", desc:"After shot van het glanzende eindresultaat", size:"Close-Up", type:"Detail", location:"Badkamer interieur", movement:"Static", lens:"85mm", inout:"Binnen", prep:10, start:"13:45", end:"14:00", people:0, props:"Supercleaners fles", dialog:"VO: Het verschil is zichtbaar.", status:"Niet klaar", img:null, comments:[] },
];

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
      style={{ background: DARK }}>{msg}</div>
  );
}

function StatusDot({ status, onClick, canEdit }) {
  const done = status === "Klaar";
  const inner = done
    ? <Check size={14} className="text-white" />
    : <div className="w-2.5 h-2.5 rounded-full bg-white" />;
  const c = done ? GREEN : ORANGE;
  return (
    <button onClick={canEdit ? onClick : undefined}
      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition ${canEdit ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
      style={{ background: c, borderColor: c }}
      title={status}>{inner}</button>
  );
}

function ImageBox({ img, small }) {
  if (img) {
    return (
      <img src={img} alt=""
        className={`object-cover rounded-lg ${small ? "w-12 h-12" : "w-full h-16"}`} />
    );
  }
  return (
    <div className={`rounded-lg border border-dashed border-gray-200 ${small ? "w-12 h-12" : "w-full h-16"}`}
      style={{ background: "#F8FAFC" }} />
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400";

export default function Shotz() {
  const [tab, setTab] = useState("projects");
  const [role, setRole] = useState("Owner");
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [activeProject, setActiveProject] = useState(null);
  const [shots, setShots] = useState(initialShots);
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("num");
  const [filterStatus, setFilterStatus] = useState("Alle");
  const [detailShot, setDetailShot] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState("");
  const [shootIdx, setShootIdx] = useState(0);
  const [editingShoot, setEditingShoot] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  // ====== SUPABASE: laden & opslaan ======
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: pRow } = await supabase
          .from("projects").select("data").eq("slug", "shotz-main").maybeSingle();
        const { data: sRow } = await supabase
          .from("projects").select("data").eq("slug", "shotz-shots").maybeSingle();

        if (pRow && pRow.data) setProjects(pRow.data);
        if (sRow && sRow.data) setShots(sRow.data);
      } catch (e) {
        console.error("Laden mislukt:", e);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await supabase.from("projects").upsert(
          { slug: "shotz-main", name: "Shotz projecten", data: projects },
          { onConflict: "slug" }
        );
        await supabase.from("projects").upsert(
          { slug: "shotz-shots", name: "Shotz shots", data: shots },
          { onConflict: "slug" }
        );
      } catch (e) {
        console.error("Opslaan mislukt:", e);
      }
    }, 600);
  }, [projects, shots, loaded]);
  // =======================================

  const canEdit = role === "Owner" || role === "Crew";
  const canEditAll = role === "Owner";
  const canComment = role !== "Viewer";

  function flash(msg) { setToast(msg); setTimeout(() => setToast(""), 1800); }

  useEffect(() => {
    if (typeof document !== "undefined") document.title = "Shotz";
  }, []);

  function addProject(data) {
    const newP = {
      id: "p" + Date.now(),
      name: data.name || "Naamloos project",
      client: data.client || "Nog te bepalen",
      date: data.date || new Date().toISOString().slice(0, 10),
      status: data.status || "Concept",
      shots: 0,
    };
    setProjects(p => [...p, newP]);
    flash("Project aangemaakt");
  }

  function saveProject(id, data) {
    setProjects(p => p.map(pr => pr.id === id ? { ...pr, ...data } : pr));
    setActiveProject(ap => ap && ap.id === id ? { ...ap, ...data } : ap);
  }

  function deleteProject(id) {
    setProjects(p => p.filter(pr => pr.id !== id));
    setDeletingProject(null);
    flash("Project verwijderd");
  }

  function cycleStatus(id) {
    setShots(s => s.map(sh => {
      if (sh.id !== id) return sh;
      return { ...sh, status: sh.status === "Klaar" ? "Niet klaar" : "Klaar" };
    }));
  }

  function updateShot(updated) { setShots(s => s.map(sh => sh.id === updated.id ? updated : sh)); }

  function addShot(data) {
    const nextNum = nextShotNumber(shots);
    const newShot = {
      id: Date.now(), num: nextNum, scene: data.scene || "", subject: data.subject || "",
      desc: data.desc || "", size: data.size || "", type: data.type || "", location: data.location || "",
      movement: data.movement || "", lens: data.lens || "", inout: data.inout || "Binnen",
      prep: Number(data.prep) || 0, start: data.start || "", end: data.end || "",
      people: Number(data.people) || 0, props: data.props || "", dialog: data.dialog || "",
      status: "Niet klaar", img: null, comments: [],
    };
    setShots(s => [...s, newShot]);
    flash("Shot toegevoegd");
  }

  function addComment(shotId, text) {
    setShots(s => s.map(sh => sh.id === shotId ? { ...sh, comments: [...sh.comments, { role, text }] } : sh));
  }

  const visibleShots = useMemo(() => {
    let list = [...shots];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => [s.num, s.location, s.desc, s.subject, s.type, s.size, s.props, s.dialog].join(" ").toLowerCase().includes(q));
    }
    if (filterStatus !== "Alle") list = list.filter(s => s.status === filterStatus);
    list.sort((a, b) => {
      if (sortBy === "num") return a.num - b.num;
      if (sortBy === "start") return (a.start || "").localeCompare(b.start || "");
      if (sortBy === "location") return (a.location || "").localeCompare(b.location || "");
      if (sortBy === "status") return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      return 0;
    });
    return list;
  }, [shots, search, filterStatus, sortBy]);

  const doneCount = shots.filter(s => s.status === "Klaar").length;

  function openProject(p) { setActiveProject(p); setTab("shotlist"); }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-3 md:px-5 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BLUE }}>
              <Aperture size={18} className="text-white" />
            </div>
            <span className="font-bold text-base hidden sm:block">Shotz</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {[["projects","Projects",LayoutGrid],["shotlist","Shotlist",List],["shoot","Shoot",Play],["pdf","PDF",FileText]].map(([key,label,Icon]) => (
              <button key={key} onClick={() => setTab(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                style={tab === key ? { background: BLUE, color: "#fff" } : { color: "#475569" }}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <select value={role} onChange={e => setRole(e.target.value)}
              className="text-xs md:text-sm border border-gray-200 rounded-lg px-2 py-1.5 font-medium focus:outline-none">
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <button onClick={() => setShowShare(true)} className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: BLUE }}>
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-20 md:pb-6">
        {tab === "projects" && (
          <ProjectsTab projects={projects} onOpen={openProject} canEdit={canEditAll}
            onNew={() => setShowNewProject(true)}
            onRename={(p) => setEditingProject(p)}
            onDelete={(p) => setDeletingProject(p)} />
        )}
        {tab === "shotlist" && (
          <ShotlistTab project={activeProject} shots={visibleShots} view={view} setView={setView}
            search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            onOpenDetail={s => setDetailShot(s)} onAdd={() => setShowAdd(true)} onImport={() => setShowImport(true)}
            onExportPdf={() => setTab("pdf")} onExportExcel={() => flash("Excel export generated")}
            cycleStatus={cycleStatus} canEdit={canEdit} doneCount={doneCount} total={shots.length}
            canEditAll={canEditAll} onRename={() => activeProject && setEditingProject(activeProject)} />
        )}
        {tab === "shoot" && (
          <ShootTab shots={[...shots].sort((a,b)=>a.num-b.num)} idx={shootIdx} setIdx={setShootIdx}
            cycleStatus={cycleStatus} canEdit={canEdit} onEdit={() => setEditingShoot(true)} />
        )}
        {tab === "pdf" && <PdfTab project={activeProject} shots={shots} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
        {[["projects","Projects",LayoutGrid],["shotlist","Shotlist",List],["shoot","Shoot",Play],["pdf","PDF",FileText]].map(([key,label,Icon]) => (
          <button key={key} onClick={() => setTab(key)} className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
            style={{ color: tab === key ? BLUE : "#94a3b8" }}>
            <Icon size={20} /><span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {detailShot && (
        <ShotDetailModal shot={detailShot} onClose={() => setDetailShot(null)}
          onSave={(u) => { updateShot(u); setDetailShot(null); flash("Shot opgeslagen"); }}
          canEdit={canEditAll} canComment={canComment} role={role}
          onComment={(t) => { addComment(detailShot.id, t); }} />
      )}
      {showAdd && <AddShotModal onClose={() => setShowAdd(false)} onAdd={(d) => { addShot(d); setShowAdd(false); }} nextNum={nextShotNumber(shots)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} role={role} setRole={setRole} flash={flash} project={activeProject} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={(t) => { setShowImport(false); flash(t); }} />}
      {editingShoot && (
        <ShootEditModal shot={[...shots].sort((a,b)=>a.num-b.num)[shootIdx]} onClose={() => setEditingShoot(false)}
          onSave={(u) => { updateShot(u); setEditingShoot(false); flash("Shot bijgewerkt"); }} />
      )}
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onAdd={(d) => { addProject(d); setShowNewProject(false); }} />}
      {editingProject && <EditProjectModal project={editingProject}
        onClose={() => setEditingProject(null)}
        onSave={(data) => { saveProject(editingProject.id, data); setEditingProject(null); flash("Project bijgewerkt"); }}
        onOpenShotlist={() => { openProject(editingProject); setEditingProject(null); }} />}
      {deletingProject && <DeleteProjectModal project={deletingProject} onClose={() => setDeletingProject(null)} onConfirm={() => deleteProject(deletingProject.id)} />}
      <Toast msg={toast} />
    </div>
  );
}

function ProjectsTab({ projects, onOpen, canEdit, onNew, onRename, onDelete }) {
  return (
    <div className="max-w-6xl mx-auto px-3 md:px-5 pt-5">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">Projecten</h1>
        {canEdit && (
          <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: BLUE }}>
            <Plus size={18} /> <span className="hidden sm:inline">Nieuw project</span>
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-5">Kies een project om de shotlist te openen</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map(p => (
          <div key={p.id} onClick={() => onOpen(p)}
            className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
                <Film size={20} style={{ color: BLUE }} />
              </div>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full text-white" style={{ background: projectStatusColor(p.status) }}>{p.status}</span>
            </div>
            <h3 className="font-bold text-sm mb-0.5">{p.name}</h3>
            <p className="text-xs text-gray-500 mb-3">{p.client} · {new Date(p.date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{p.shots} shots</span>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {canEdit && (
                  <>
                    <button onClick={() => onRename(p)} title="Naam wijzigen"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => onDelete(p)} title="Verwijderen"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
                <button onClick={() => onOpen(p)} className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: BLUE }}>Open shotlist</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {projects.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-16">Nog geen projecten. Maak er een aan met de knop hierboven.</div>
      )}
    </div>
  );
}

function projectStatusColor(status) {
  if (status === "Afgerond") return GREEN;
  if (status === "In productie") return ORANGE;
  if (status === "Gepland") return GRAY;
  return BLUE;
}

function ShotlistTab(props) {
  const { project, shots, view, setView, search, setSearch, sortBy, setSortBy,
    filterStatus, setFilterStatus, onOpenDetail, onAdd, onImport, onExportPdf,
    onExportExcel, cycleStatus, canEdit, doneCount, total, canEditAll, onRename } = props;
  return (
    <div className="max-w-7xl mx-auto px-3 md:px-5 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold">{project ? project.name : "Commercial Supercleaners"}</h1>
            {canEditAll && project && (
              <button onClick={onRename} title="Projectnaam wijzigen"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                <Pencil size={14} />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">{total} shots · {doneCount} klaar</p>
        </div>
        <button onClick={() => setView(view === "table" ? "storyboard" : "table")}
          className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">
          {view === "table" ? <LayoutGrid size={16} /> : <List size={16} />}
          <span className="hidden sm:inline">{view === "table" ? "Storyboard" : "Table"}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2.5 mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[160px] bg-gray-50 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek shots..." className="bg-transparent text-sm flex-1 focus:outline-none" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-2 text-gray-600">
          <option value="num">Shot #</option><option value="start">Starttijd</option><option value="location">Locatie</option><option value="status">Status</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-2 text-gray-600">
          <option>Alle</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {canEdit && (
          <button onClick={onAdd} className="flex items-center gap-1 px-3 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: BLUE }}>
            <Plus size={16} /> <span className="hidden sm:inline">Add Shot</span>
          </button>
        )}
        <button onClick={onImport} className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">
          <Upload size={16} /> <span className="hidden md:inline">Import</span>
        </button>
        <button onClick={onExportPdf} className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">
          <FileText size={16} /> <span className="hidden md:inline">PDF</span>
        </button>
        <button onClick={onExportExcel} className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">
          <Download size={16} /> <span className="hidden md:inline">Excel</span>
        </button>
      </div>

      {view === "table" && (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                  <th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 font-semibold">Image</th>
                  <th className="px-3 py-3 font-semibold">#</th><th className="px-3 py-3 font-semibold">Time</th>
                  <th className="px-3 py-3 font-semibold">Shot size</th><th className="px-3 py-3 font-semibold">Shot type</th>
                  <th className="px-3 py-3 font-semibold">Location</th><th className="px-3 py-3 font-semibold min-w-[200px]">Action</th>
                  <th className="px-3 py-3 font-semibold">Movement</th><th className="px-3 py-3 font-semibold">Lens</th>
                  <th className="px-3 py-3 font-semibold">Start</th><th className="px-3 py-3 font-semibold">End</th>
                </tr>
              </thead>
              <tbody>
                {shots.map(s => (
                  <tr key={s.id} onClick={() => onOpenDetail(s)} className="border-b border-gray-100 hover:bg-blue-50/40 cursor-pointer transition">
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}><StatusDot status={s.status} onClick={() => cycleStatus(s.id)} canEdit={canEdit} /></td>
                    <td className="px-3 py-3"><div className="w-16"><ImageBox img={s.img} /></div></td>
                    <td className="px-3 py-3 font-bold">{s.num}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{s.prep}m</td>
                    <td className="px-3 py-3 whitespace-nowrap">{s.size}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{s.type}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{s.location}</td>
                    <td className="px-3 py-3 text-gray-600">{s.desc}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{s.movement}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{s.lens}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{s.start}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{s.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-2">
            {shots.map(s => (
              <div key={s.id} onClick={() => onOpenDetail(s)} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 active:bg-blue-50 transition">
                <div onClick={e => e.stopPropagation()}><StatusDot status={s.status} onClick={() => cycleStatus(s.id)} canEdit={canEdit} /></div>
                <ImageBox img={s.img} small />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">#{s.num}</span>
                    <span className="text-xs text-gray-400">{s.start}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ background: "#EFF6FF", color: BLUE }}>{s.size}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{s.location}</p>
                  <p className="text-xs text-gray-700 truncate">{s.desc}</p>
                </div>
                {s.comments.length > 0 && (
                  <div className="flex items-center gap-0.5 text-gray-400"><MessageSquare size={14} /><span className="text-xs">{s.comments.length}</span></div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {view === "storyboard" && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {shots.map(s => (
            <div key={s.id} onClick={() => onOpenDetail(s)} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md cursor-pointer transition">
              <div className="relative">
                <ImageBox img={s.img} />
                <div className="absolute top-2 left-2" onClick={e => e.stopPropagation()}><StatusDot status={s.status} onClick={() => cycleStatus(s.id)} canEdit={canEdit} /></div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">#{s.num}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ background: "#EFF6FF", color: BLUE }}>{s.size}</span>
                </div>
                <p className="text-xs text-gray-700 line-clamp-2 mb-1">{s.desc}</p>
                <p className="text-[11px] text-gray-400">{s.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShotDetailModal({ shot, onClose, onSave, canEdit, canComment, role, onComment }) {
  const [form, setForm] = useState({ ...shot });
  const [comment, setComment] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal onClose={onClose} title={`Shot #${shot.num}`} subtitle={shot.subject}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ImageBox img={form.img} />
          <div className="flex flex-col justify-center"><p className="text-xs text-gray-400">Status</p><p className="font-semibold text-sm">{form.status}</p></div>
        </div>
        <Field label="Scene omschrijving"><textarea disabled={!canEdit} value={form.desc} onChange={e => set("desc", e.target.value)} rows={2} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Onderwerp"><input disabled={!canEdit} value={form.subject} onChange={e=>set("subject",e.target.value)} className={inputCls} /></Field>
          <Field label="Locatie"><input disabled={!canEdit} value={form.location} onChange={e=>set("location",e.target.value)} className={inputCls} /></Field>
          <Field label="Shot size"><select disabled={!canEdit} value={form.size} onChange={e=>set("size",e.target.value)} className={inputCls}><option value="">-</option>{SHOT_SIZES.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Shot type"><select disabled={!canEdit} value={form.type} onChange={e=>set("type",e.target.value)} className={inputCls}><option value="">-</option>{SHOT_TYPES.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Camera movement"><select disabled={!canEdit} value={form.movement} onChange={e=>set("movement",e.target.value)} className={inputCls}><option value="">-</option>{MOVEMENTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Lens"><select disabled={!canEdit} value={form.lens} onChange={e=>set("lens",e.target.value)} className={inputCls}><option value="">-</option>{LENSES.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Binnen/Buiten"><select disabled={!canEdit} value={form.inout} onChange={e=>set("inout",e.target.value)} className={inputCls}>{INOUT.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Voorbereidingstijd (m)"><input disabled={!canEdit} type="number" value={form.prep} onChange={e=>set("prep",e.target.value)} className={inputCls} /></Field>
          <Field label="Starttijd"><input disabled={!canEdit} value={form.start} onChange={e=>set("start",e.target.value)} className={inputCls} /></Field>
          <Field label="Eindtijd"><input disabled={!canEdit} value={form.end} onChange={e=>set("end",e.target.value)} className={inputCls} /></Field>
          <Field label="Personen in beeld"><input disabled={!canEdit} type="number" value={form.people} onChange={e=>set("people",e.target.value)} className={inputCls} /></Field>
          <Field label="Props"><input disabled={!canEdit} value={form.props} onChange={e=>set("props",e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Dialoog / voice-over"><textarea disabled={!canEdit} value={form.dialog} onChange={e=>set("dialog",e.target.value)} rows={2} className={inputCls} /></Field>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1"><MessageSquare size={14}/> Opmerkingen</p>
          <div className="space-y-2 mb-3">
            {form.comments.length === 0 && <p className="text-xs text-gray-400">Nog geen opmerkingen.</p>}
            {form.comments.map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2.5">
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md text-white mr-2" style={{ background: c.role === "Client" ? DARK : BLUE }}>{c.role}</span>
                <span className="text-sm text-gray-700">{c.text}</span>
              </div>
            ))}
          </div>
          {canComment && (
            <div className="flex gap-2">
              <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Plaats een opmerking..." className={inputCls}
                onKeyDown={e=>{ if(e.key==="Enter"&&comment.trim()){ onComment(comment); setForm(f=>({...f,comments:[...f.comments,{role,text:comment}]})); setComment(""); }}} />
              <button onClick={()=>{ if(comment.trim()){ onComment(comment); setForm(f=>({...f,comments:[...f.comments,{role,text:comment}]})); setComment(""); }}}
                className="px-3 rounded-lg text-white" style={{ background: BLUE }}><Send size={16}/></button>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm">Sluiten</button>
        {canEdit && <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: BLUE }}>Opslaan</button>}
      </div>
    </Modal>
  );
}

function AddShotModal({ onClose, onAdd, nextNum }) {
  const [f, setF] = useState({ scene:"", subject:"", desc:"", size:"", type:"", location:"", movement:"", lens:"", inout:"Binnen", prep:0, start:"", end:"", people:0, props:"", dialog:"" });
  const set = (k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <Modal onClose={onClose} title="Add Shot" subtitle={`Shot #${nextNum} wordt automatisch toegevoegd`}>
      <div className="space-y-3">
        <Field label="Actie omschrijving"><textarea value={f.desc} onChange={e=>set("desc",e.target.value)} rows={2} className={inputCls} placeholder="Wat gebeurt er in dit shot?" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Scene"><input value={f.scene} onChange={e=>set("scene",e.target.value)} className={inputCls} /></Field>
          <Field label="Locatie"><input value={f.location} onChange={e=>set("location",e.target.value)} className={inputCls} /></Field>
          <Field label="Shot size"><select value={f.size} onChange={e=>set("size",e.target.value)} className={inputCls}><option value="">-</option>{SHOT_SIZES.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Shot type"><select value={f.type} onChange={e=>set("type",e.target.value)} className={inputCls}><option value="">-</option>{SHOT_TYPES.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Camera movement"><select value={f.movement} onChange={e=>set("movement",e.target.value)} className={inputCls}><option value="">-</option>{MOVEMENTS.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Lens"><select value={f.lens} onChange={e=>set("lens",e.target.value)} className={inputCls}><option value="">-</option>{LENSES.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Binnen/Buiten"><select value={f.inout} onChange={e=>set("inout",e.target.value)} className={inputCls}>{INOUT.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Prep (m)"><input type="number" value={f.prep} onChange={e=>set("prep",e.target.value)} className={inputCls} /></Field>
          <Field label="Starttijd"><input value={f.start} onChange={e=>set("start",e.target.value)} className={inputCls} placeholder="09:00" /></Field>
          <Field label="Eindtijd"><input value={f.end} onChange={e=>set("end",e.target.value)} className={inputCls} placeholder="09:20" /></Field>
        </div>
        <Field label="Props"><input value={f.props} onChange={e=>set("props",e.target.value)} className={inputCls} /></Field>
        <Field label="Dialoog / voice-over"><textarea value={f.dialog} onChange={e=>set("dialog",e.target.value)} rows={2} className={inputCls} /></Field>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm">Annuleren</button>
        <button onClick={() => onAdd(f)} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: BLUE }}>Add Shot</button>
      </div>
    </Modal>
  );
}

function ShareModal({ onClose, role, setRole, flash, project }) {
  const slug = slugify(project ? project.name : "commercial-supercleaners");
  const shareLink = `https://shotz.app/s/${slug}`;
  const rights = {
    Owner: ["Alles bekijken", "Alles bewerken", "Exporteren / importeren", "Delen"],
    Crew: ["Bekijken", "Shots afvinken", "Notities toevoegen", "Shot details bekijken"],
    Client: ["Bekijken", "Opmerkingen plaatsen"],
    Viewer: ["Alleen bekijken"],
  };
  return (
    <Modal onClose={onClose} title="Delen" subtitle="Deel met crew en klant">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Deelbare link</label>
          <div className="flex gap-2">
            <input readOnly value={shareLink} className={inputCls + " bg-gray-50"} />
            <button onClick={() => flash("Link gekopieerd")} className="px-3 rounded-lg text-white text-sm font-semibold" style={{ background: BLUE }}>Kopieer</button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Rollen & rechten</label>
          <div className="space-y-2">
            {ROLES.map(r => (
              <div key={r} className={`rounded-xl border p-3 cursor-pointer transition ${role===r ? "border-blue-400 bg-blue-50/50" : "border-gray-200"}`} onClick={() => setRole(r)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    {r === "Client" ? <User size={15} style={{color:ORANGE}}/> : r === "Viewer" ? <Eye size={15} className="text-gray-400"/> : <Users size={15} style={{color:BLUE}}/>}
                    {r}
                  </span>
                  {role === r && <Check size={16} style={{ color: BLUE }} />}
                </div>
                <p className="text-xs text-gray-500">{rights[r].join(" · ")}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Klanten kunnen opmerkingen plaatsen, maar de shotlist niet bewerken.</p>
        </div>
      </div>
      <button onClick={onClose} className="w-full mt-5 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: DARK }}>Klaar</button>
    </Modal>
  );
}

function ImportModal({ onClose, onDone }) {
  const mapping = [["Shot #","Shotnummer"],["Description","Actie omschrijving"],["Location","Locatie"],["Shot Size","Shot size"],["Movement","Camera movement"],["Lens","Type lens"]];
  return (
    <Modal onClose={onClose} title="Import" subtitle="PDF of Excel importeren">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-4">
        <Upload size={28} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Sleep een bestand hierheen of klik om te uploaden</p>
        <p className="text-xs text-gray-400 mt-1">PDF, XLSX of XLS</p>
      </div>
      <div className="bg-blue-50/50 rounded-xl p-3 mb-4">
        <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: BLUE }}><Check size={14}/> Auto-detect columns</p>
        <p className="text-[11px] text-gray-500 mb-2">Kolommen worden automatisch herkend en gekoppeld:</p>
        <div className="space-y-1">
          {mapping.map(([a,b]) => (
            <div key={a} className="flex items-center gap-2 text-xs">
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">{a}</span>
              <ChevronRight size={12} className="text-gray-400" />
              <span style={{ color: BLUE }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm">Annuleren</button>
        <button onClick={() => onDone("Bestand geïmporteerd")} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: BLUE }}>Match & import</button>
      </div>
    </Modal>
  );
}

function ShootTab({ shots, idx, setIdx, cycleStatus, canEdit, onEdit }) {
  const current = shots[idx];
  const next = shots[idx + 1];
  if (!current) return null;
  const done = current.status === "Klaar";
  return (
    <div className="max-w-md mx-auto px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-gray-400 uppercase">Shoot Mode</span>
        <span className="text-xs text-gray-400">{idx + 1} / {shots.length}</span>
      </div>
      <div className="bg-white rounded-2xl border-2 p-5 mb-3" style={{ borderColor: BLUE }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-3xl font-bold">#{current.num}</span>
          <StatusDot status={current.status} onClick={() => cycleStatus(current.id)} canEdit={canEdit} />
        </div>
        {current.img && (
          <img src={current.img} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
        )}
        <div className="space-y-2 text-sm">
          <Row icon={MapPin} label="Locatie" value={current.location} />
          <Row icon={Clock} label="Tijd" value={`${current.start} - ${current.end}`} />
          <Row icon={Film} label="Shot" value={`${current.size} · ${current.type}`} />
        </div>
        <p className="text-sm text-gray-700 mt-3 bg-gray-50 rounded-lg p-3">{current.desc}</p>
        {canEdit && (
          <button onClick={onEdit} className="w-full mt-4 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm flex items-center justify-center gap-2">
            <Edit3 size={16} /> Bewerk dit shot
          </button>
        )}
        <button onClick={() => cycleStatus(current.id)}
          className="w-full mt-2 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: done ? GREEN : ORANGE }}>
          <Check size={18} /> {done ? "Klaar" : "Markeer als klaar"}
        </button>
      </div>
      {next && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3 flex items-center gap-3 opacity-70">
          <span className="text-xs font-semibold text-gray-400 uppercase">Volgende</span>
          <span className="font-bold">#{next.num}</span>
          <span className="text-xs text-gray-500 truncate">{next.location} · {next.size}</span>
        </div>
      )}
      <div className="flex gap-2">
        <button disabled={idx === 0} onClick={() => setIdx(i => Math.max(0, i - 1))}
          className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-40">
          <ChevronLeft size={18} /> Vorige
        </button>
        <button disabled={idx === shots.length - 1} onClick={() => setIdx(i => Math.min(shots.length - 1, i + 1))}
          className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-40" style={{ background: DARK }}>
          Volgende <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-gray-400" />
      <span className="text-gray-400 text-xs w-16">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ShootEditModal({ shot, onClose, onSave }) {
  const [f, setF] = useState({ ...shot });
  const set = (k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <Modal onClose={onClose} title={`Edit Shot #${shot.num}`} subtitle="Snel aanpassen tijdens de shoot">
      <div className="space-y-3">
        <Field label="Locatie"><input value={f.location} onChange={e=>set("location",e.target.value)} className={inputCls} /></Field>
        <Field label="Actie omschrijving"><textarea value={f.desc} onChange={e=>set("desc",e.target.value)} rows={2} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Shot size"><select value={f.size} onChange={e=>set("size",e.target.value)} className={inputCls}><option value="">-</option>{SHOT_SIZES.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Shot type"><select value={f.type} onChange={e=>set("type",e.target.value)} className={inputCls}><option value="">-</option>{SHOT_TYPES.map(o=><option key={o}>{o}</option>)}</select></Field>
          <Field label="Starttijd"><input value={f.start} onChange={e=>set("start",e.target.value)} className={inputCls} /></Field>
          <Field label="Eindtijd"><input value={f.end} onChange={e=>set("end",e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Notities"><textarea value={f.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className={inputCls} placeholder="Notities..." /></Field>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm">Annuleren</button>
        <button onClick={() => onSave(f)} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: BLUE }}>Opslaan</button>
      </div>
    </Modal>
  );
}

function PdfTab({ project, shots }) {
  const sorted = [...shots].sort((a,b)=>a.num-b.num);
  const projName = project ? project.name : "Commercial Supercleaners";
  const projClient = project ? project.client : "Supercleaners";

  function downloadPdf() {
    const rows = sorted.map(s => `
      <tr>
        <td>${s.num}</td>
        <td>${s.size || ""}</td>
        <td>${s.type || ""}</td>
        <td>${s.location || ""}</td>
        <td>${(s.desc || "").replace(/</g, "&lt;")}</td>
        <td>${s.start || ""}</td>
        <td>${s.end || ""}</td>
      </tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Shotz - ${projName}</title>
      <style>
        body{font-family:-apple-system,system-ui,sans-serif;color:#0A0A0A;padding:24px;}
        h1{font-size:20px;margin:0 0 2px;}
        .sub{color:#666;font-size:12px;margin-bottom:16px;}
        table{width:100%;border-collapse:collapse;font-size:11px;}
        th{text-align:left;text-transform:uppercase;color:#666;border-bottom:2px solid #0A0A0A;padding:6px 4px;}
        td{border-bottom:1px solid #eee;padding:6px 4px;vertical-align:top;}
        thead{display:table-header-group;}
      </style></head><body>
      <h1>Shotz — ${projName}</h1>
      <div class="sub">${projClient} · ${new Date().toLocaleDateString("nl-NL")}</div>
      <table><thead><tr>
        <th>#</th><th>Size</th><th>Type</th><th>Location</th><th>Action</th><th>Start</th><th>End</th>
      </tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  }

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-5 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg md:text-xl font-bold">PDF Preview</h1>
        <div className="flex gap-2">
          <button onClick={downloadPdf} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: BLUE }}>
            <Printer size={16} /> Download PDF
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">Tip: kies in het printvenster "Opslaan als PDF" als bestemming. Werkt op laptop en telefoon.</p>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-8 overflow-x-auto">
        <div className="flex items-center justify-between mb-5 pb-4 border-b-2" style={{ borderColor: DARK }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BLUE }}><Aperture size={18} className="text-white" /></div>
            <span className="font-bold text-lg">Shotz</span>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold text-gray-900">{projName}</p>
            <p>{projClient}</p>
            <p>{new Date().toLocaleDateString("nl-NL")}</p>
          </div>
        </div>
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-300 text-left uppercase text-gray-500">
              <th className="py-2 pr-2">Image</th><th className="py-2 pr-2">#</th><th className="py-2 pr-2">Size</th>
              <th className="py-2 pr-2">Type</th><th className="py-2 pr-2">Location</th><th className="py-2 pr-2 min-w-[160px]">Action</th>
              <th className="py-2 pr-2">Start</th><th className="py-2 pr-2">End</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => {
              return (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2">
                    {s.img
                      ? <img src={s.img} alt="" className="w-12 h-9 object-cover rounded border border-gray-200" />
                      : <div className="w-12 h-9 rounded border border-dashed border-gray-200" style={{ background: "#F8FAFC" }} />}
                  </td>
                  <td className="py-2 pr-2 font-bold">{s.num}</td>
                  <td className="py-2 pr-2">{s.size}</td>
                  <td className="py-2 pr-2">{s.type}</td>
                  <td className="py-2 pr-2">{s.location}</td>
                  <td className="py-2 pr-2 text-gray-600">{s.desc}</td>
                  <td className="py-2 pr-2">{s.start}</td>
                  <td className="py-2 pr-2">{s.end}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-right text-xs text-gray-400 mt-4">1 of 1</p>
      </div>
    </div>
  );
}

function NewProjectModal({ onClose, onAdd }) {
  const [f, setF] = useState({ name: "", client: "", date: new Date().toISOString().slice(0,10), status: "Concept" });
  const set = (k,v) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal onClose={onClose} title="Nieuw project" subtitle="Vul de basisgegevens in">
      <div className="space-y-3">
        <Field label="Projectnaam"><input value={f.name} onChange={e=>set("name",e.target.value)} className={inputCls} placeholder="Naam van het project" autoFocus /></Field>
        <Field label="Klant"><input value={f.client} onChange={e=>set("client",e.target.value)} className={inputCls} placeholder="Naam van de klant" /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Datum"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} className={inputCls + " min-w-0"} /></Field>
          <Field label="Status"><select value={f.status} onChange={e=>set("status",e.target.value)} className={inputCls + " min-w-0"}>{PROJECT_STATUSES.map(o=><option key={o}>{o}</option>)}</select></Field>
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm">Annuleren</button>
        <button onClick={() => f.name.trim() && onAdd(f)} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: BLUE }}>Project aanmaken</button>
      </div>
    </Modal>
  );
}

function EditProjectModal({ project, onClose, onSave, onOpenShotlist }) {
  const [f, setF] = useState({
    name: project.name,
    client: project.client || "",
    date: project.date || new Date().toISOString().slice(0,10),
    status: project.status || "Concept",
  });
  const set = (k,v) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal onClose={onClose} title="Project bewerken" subtitle={project.name}>
      <div className="space-y-3">
        <Field label="Projectnaam"><input value={f.name} onChange={e=>set("name",e.target.value)} className={inputCls} autoFocus /></Field>
        <Field label="Klant"><input value={f.client} onChange={e=>set("client",e.target.value)} className={inputCls} placeholder="Naam van de klant" /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Datum"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} className={inputCls + " min-w-0"} /></Field>
          <Field label="Status"><select value={f.status} onChange={e=>set("status",e.target.value)} className={inputCls + " min-w-0"}>{PROJECT_STATUSES.map(o=><option key={o}>{o}</option>)}</select></Field>
        </div>
        <button onClick={onOpenShotlist} className="w-full py-2.5 rounded-xl border border-gray-200 font-semibold text-sm flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50">
          <List size={16} /> Shotlist openen
        </button>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm">Annuleren</button>
        <button onClick={() => f.name.trim() && onSave(f)} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: BLUE }}>Opslaan</button>
      </div>
    </Modal>
  );
}

function DeleteProjectModal({ project, onClose, onConfirm }) {
  return (
    <Modal onClose={onClose} title="Project verwijderen" subtitle={project.name}>
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "#FEF2F2" }}>
          <Trash2 size={22} style={{ color: RED }} />
        </div>
        <p className="text-sm text-gray-700">Weet je zeker dat je <span className="font-semibold">{project.name}</span> wilt verwijderen?</p>
        <p className="text-xs text-gray-400 mt-1">Dit kan niet ongedaan worden gemaakt.</p>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm">Annuleren</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: RED }}>Verwijderen</button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, title, subtitle }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-lg">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
