import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type TableShape = "round" | "rect" | "couple";
type ObjectShape = "rect" | "circle";

interface CanvasTable {
  id: number;
  dbId?: number;
  number: number | null;
  shape: TableShape;
  seats: number;
  name: string;
  x: number;
  y: number;
  customW?: number;
  customH?: number;
  guests: number[];
}

interface CanvasObject {
  id: number;
  dbId?: number;
  shape: ObjectShape;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface VenueFrame {
  widthM: number;
  heightM: number;
  x: number;
  y: number;
}

interface Guest {
  id: number;
  name: string;
  count: number;
  side?: string | null;
  group?: string | null;
}

const METERS_TO_PX = 25;
const MIN_SIZE = 40;
const MAX_SIZE = 600;
const MAX_HISTORY = 50;

function getTableSize(t: CanvasTable): { w: number; h: number } {
  if (t.customW && t.customH) return { w: t.customW, h: t.customH };
  if (t.shape === "couple") {
    const w = Math.max(90, 60 + t.seats * 18);
    return { w, h: 50 };
  }
  if (t.shape === "rect") {
    const w = Math.max(100, 60 + t.seats * 14);
    return { w, h: 70 };
  }
  const base = 90;
  const extra = Math.max(0, t.seats - 6) * 5;
  return { w: base + extra, h: base + extra };
}

function getOccupancy(t: CanvasTable, guests: Guest[]): { occupied: number; total: number } {
  const occupied = t.guests.reduce((s, gid) => {
    const g = guests.find(g => g.id === gid);
    return s + (g ? g.count : 0);
  }, 0);
  return { occupied, total: t.seats };
}

let _nextTempId = -1;
function nextTempId() { return _nextTempId--; }

export default function Seating() {
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const [tables, setTables] = useState<CanvasTable[]>([]);
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [venueFrame, setVenueFrame] = useState<VenueFrame | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [zoom, setZoom] = useState(1);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [guestFilter, setGuestFilter] = useState<"unseated" | "all">("unseated");
  const [guestSearch, setGuestSearch] = useState("");
  const [defaultSeats, setDefaultSeats] = useState({ round: 12, rect: 8, couple: 2 });
  const [nextTableNumber, setNextTableNumber] = useState(1);
  const [popoverTable, setPopoverTable] = useState<CanvasTable | null>(null);
  const [popoverObject, setPopoverObject] = useState<CanvasObject | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venueInput, setVenueInput] = useState({ w: 20, h: 30 });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const historyRef = useRef<{ tables: CanvasTable[]; objects: CanvasObject[]; venueFrame: VenueFrame | null }[]>([]);

  function pushHistory(t: CanvasTable[], o: CanvasObject[], vf: VenueFrame | null) {
    historyRef.current.push({
      tables: JSON.parse(JSON.stringify(t)),
      objects: JSON.parse(JSON.stringify(o)),
      venueFrame: vf ? JSON.parse(JSON.stringify(vf)) : null,
    });
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
  }

  function undo() {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    setTables(prev.tables);
    setObjects(prev.objects);
    setVenueFrame(prev.venueFrame);
    setSelectedTableId(null);
    setSelectedObjectId(null);
    setPopoverTable(null);
    setPopoverObject(null);
    setIsDirty(true);
  }

  const { data: canvasData, isLoading } = trpc.seating.loadCanvas.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!canvasData) return;
    const dbTables: CanvasTable[] = (canvasData.tables as any[]).map(t => ({
      id: t.id,
      dbId: t.id,
      number: t.tableNumber ?? null,
      shape: t.shape as TableShape,
      seats: t.capacity,
      name: t.name ?? "",
      x: parseFloat(t.x),
      y: parseFloat(t.y),
      customW: t.customW ? parseFloat(t.customW) : undefined,
      customH: t.customH ? parseFloat(t.customH) : undefined,
      guests: (t.assignedGuests as number[]) ?? [],
    }));
    const dbObjects: CanvasObject[] = (canvasData.objects as any[]).map(o => ({
      id: o.id,
      dbId: o.id,
      shape: o.shape as ObjectShape,
      name: o.name ?? "",
      x: parseFloat(o.x),
      y: parseFloat(o.y),
      w: parseFloat(o.w),
      h: parseFloat(o.h),
    }));
    const vf = (canvasData.venueFrame as any)
      ? {
          widthM: (canvasData.venueFrame as any).widthM,
          heightM: (canvasData.venueFrame as any).heightM,
          x: parseFloat((canvasData.venueFrame as any).x),
          y: parseFloat((canvasData.venueFrame as any).y),
        }
      : null;
    setTables(dbTables);
    setObjects(dbObjects);
    setVenueFrame(vf);
    setGuests((canvasData.guests as Guest[]) ?? []);
    const maxNum = dbTables.reduce((m, t) => (t.number != null && t.number > m ? t.number : m), 0);
    setNextTableNumber(maxNum + 1);
    setIsDirty(false);
  }, [canvasData]);

  const saveLayoutMutation = trpc.seating.saveLayout.useMutation({
    onSuccess: () => { setIsDirty(false); toast.success("הפריסה נשמרה"); },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveLayoutMutation.mutateAsync({
        tables: tables.map(t => ({
          id: t.dbId,
          label: t.name || `שולחן ${t.number ?? ""}`,
          capacity: t.seats,
          shape: t.shape,
          tableNumber: t.number,
          name: t.name,
          x: t.x,
          y: t.y,
          customW: t.customW ?? null,
          customH: t.customH ?? null,
          assignedGuests: t.guests,
        })),
        objects: objects.map(o => ({
          id: o.dbId,
          shape: o.shape,
          name: o.name,
          x: o.x,
          y: o.y,
          w: o.w,
          h: o.h,
        })),
        venueFrame,
      });
    } finally {
      setIsSaving(false);
    }
  }, [tables, objects, venueFrame, saveLayoutMutation]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  function addTable(shape: TableShape, seats: number, x: number, y: number) {
    pushHistory(tables, objects, venueFrame);
    const num = shape === "couple" ? null : nextTableNumber;
    const newTable: CanvasTable = { id: nextTempId(), number: num, shape, seats, name: "", x, y, guests: [] };
    if (shape !== "couple") setNextTableNumber(n => n + 1);
    setTables(prev => [...prev, newTable]);
    setIsDirty(true);
  }

  function addObject(shape: ObjectShape, x: number, y: number) {
    pushHistory(tables, objects, venueFrame);
    const dims = shape === "rect" ? { w: 160, h: 70 } : { w: 80, h: 80 };
    const newObj: CanvasObject = { id: nextTempId(), shape, name: "", x, y, ...dims };
    setObjects(prev => [...prev, newObj]);
    setIsDirty(true);
    setTimeout(() => {
      setPopoverObject(newObj);
      setSelectedObjectId(newObj.id);
      const wrap = canvasWrapRef.current;
      if (wrap) {
        const r = wrap.getBoundingClientRect();
        setPopoverPos({ x: r.left + x * zoom + dims.w / 2 + 10, y: r.top + y * zoom });
      }
    }, 0);
  }

  const templateDragRef = useRef<{ type: "table" | "object"; shape: string; seats?: number } | null>(null);

  function onTemplateDragStart(type: "table" | "object", shape: string, seats?: number) {
    templateDragRef.current = { type, shape, seats };
  }

  function onCanvasDragOver(e: React.DragEvent) { if (templateDragRef.current) e.preventDefault(); }

  function onCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    const drag = templateDragRef.current;
    if (!drag) return;
    templateDragRef.current = null;
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    if (drag.type === "table") addTable(drag.shape as TableShape, drag.seats ?? 8, x, y);
    else addObject(drag.shape as ObjectShape, x, y);
  }

  // ─── Table drag (move) ──────────────────────────────────────────────────────
  const tableDragRef = useRef<{ id: number; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean; historySaved: boolean } | null>(null);

  function onTableMouseDown(e: React.MouseEvent, t: CanvasTable) {
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
    e.stopPropagation();
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    tableDragRef.current = {
      id: t.id, startX: e.clientX, startY: e.clientY,
      offsetX: e.clientX - rect.left - t.x * zoom,
      offsetY: e.clientY - rect.top - t.y * zoom,
      moved: false, historySaved: false,
    };
    const onMove = (ev: MouseEvent) => {
      const d = tableDragRef.current;
      if (!d) return;
      if (Math.abs(ev.clientX - d.startX) > 3 || Math.abs(ev.clientY - d.startY) > 3) d.moved = true;
      if (d.moved && !d.historySaved) { pushHistory(tables, objects, venueFrame); d.historySaved = true; }
      const wrap2 = canvasWrapRef.current;
      if (!wrap2) return;
      const r2 = wrap2.getBoundingClientRect();
      const nx = (ev.clientX - r2.left - d.offsetX) / zoom;
      const ny = (ev.clientY - r2.top - d.offsetY) / zoom;
      setTables(prev => prev.map(tt => tt.id === d.id ? { ...tt, x: nx, y: ny } : tt));
      setIsDirty(true);
    };
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); tableDragRef.current = null; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // ─── Object drag (move) ─────────────────────────────────────────────────────
  const objectDragRef = useRef<{ id: number; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean; historySaved: boolean } | null>(null);

  function onObjectMouseDown(e: React.MouseEvent, o: CanvasObject) {
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
    e.stopPropagation();
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    objectDragRef.current = {
      id: o.id, startX: e.clientX, startY: e.clientY,
      offsetX: e.clientX - rect.left - o.x * zoom,
      offsetY: e.clientY - rect.top - o.y * zoom,
      moved: false, historySaved: false,
    };
    const onMove = (ev: MouseEvent) => {
      const d = objectDragRef.current;
      if (!d) return;
      if (Math.abs(ev.clientX - d.startX) > 3 || Math.abs(ev.clientY - d.startY) > 3) d.moved = true;
      if (d.moved && !d.historySaved) { pushHistory(tables, objects, venueFrame); d.historySaved = true; }
      const wrap2 = canvasWrapRef.current;
      if (!wrap2) return;
      const r2 = wrap2.getBoundingClientRect();
      const nx = (ev.clientX - r2.left - d.offsetX) / zoom;
      const ny = (ev.clientY - r2.top - d.offsetY) / zoom;
      setObjects(prev => prev.map(oo => oo.id === d.id ? { ...oo, x: nx, y: ny } : oo));
      setIsDirty(true);
    };
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); objectDragRef.current = null; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // ─── Resize ─────────────────────────────────────────────────────────────────
  const resizeRef = useRef<{ kind: "table" | "object"; id: number; dir: string; startX: number; startY: number; startW: number; startH: number; startCX: number; startCY: number } | null>(null);

  function startResize(e: React.MouseEvent, kind: "table" | "object", id: number, dir: string) {
    e.stopPropagation();
    e.preventDefault();
    let startW = 0, startH = 0, startCX = 0, startCY = 0;
    if (kind === "table") {
      const t = tables.find(t => t.id === id)!;
      const sz = getTableSize(t);
      startW = sz.w; startH = sz.h; startCX = t.x; startCY = t.y;
    } else {
      const o = objects.find(o => o.id === id)!;
      startW = o.w; startH = o.h; startCX = o.x; startCY = o.y;
    }
    pushHistory(tables, objects, venueFrame);
    resizeRef.current = { kind, id, dir, startX: e.clientX, startY: e.clientY, startW, startH, startCX, startCY };
    const onMove = (ev: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      const dx = (ev.clientX - r.startX) / zoom;
      const dy = (ev.clientY - r.startY) / zoom;
      let nw = r.startW, nh = r.startH, ncx = r.startCX, ncy = r.startCY;
      if (r.dir.includes("e")) { nw = Math.max(MIN_SIZE, Math.min(MAX_SIZE, r.startW - dx)); ncx = r.startCX + dx / 2; }
      else if (r.dir.includes("w")) { nw = Math.max(MIN_SIZE, Math.min(MAX_SIZE, r.startW + dx)); ncx = r.startCX + dx / 2; }
      if (r.dir.includes("n")) { nh = Math.max(MIN_SIZE, Math.min(MAX_SIZE, r.startH - dy)); ncy = r.startCY + dy / 2; }
      else if (r.dir.includes("s")) { nh = Math.max(MIN_SIZE, Math.min(MAX_SIZE, r.startH + dy)); ncy = r.startCY + dy / 2; }
      if (r.kind === "table") setTables(prev => prev.map(t => t.id === r.id ? { ...t, customW: nw, customH: nh, x: ncx, y: ncy } : t));
      else setObjects(prev => prev.map(o => o.id === r.id ? { ...o, w: nw, h: nh, x: ncx, y: ncy } : o));
      setIsDirty(true);
    };
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); resizeRef.current = null; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // ─── Guest drag ─────────────────────────────────────────────────────────────
  const guestDragRef = useRef<number | null>(null);

  function onGuestDragStart(guestId: number) { guestDragRef.current = guestId; }

  function onTableDrop(e: React.DragEvent, tableId: number) {
    e.preventDefault();
    const gid = guestDragRef.current;
    if (gid == null) return;
    guestDragRef.current = null;
    const guest = guests.find(g => g.id === gid);
    const table = tables.find(t => t.id === tableId);
    if (!guest || !table) return;
    const { occupied, total } = getOccupancy(table, guests);
    if (occupied + guest.count > total) { toast.error(`אין מספיק מקום. פנויים: ${total - occupied}, נדרשים: ${guest.count}`); return; }
    pushHistory(tables, objects, venueFrame);
    setTables(prev => prev.map(t => {
      const filtered = t.guests.filter(g => g !== gid);
      if (t.id === tableId) return { ...t, guests: [...filtered, gid] };
      return { ...t, guests: filtered };
    }));
    setIsDirty(true);
  }

  function removeGuestFromTable(guestId: number, tableId: number) {
    pushHistory(tables, objects, venueFrame);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, guests: t.guests.filter(g => g !== guestId) } : t));
    setPopoverTable(prev => prev && prev.id === tableId ? { ...prev, guests: prev.guests.filter(g => g !== guestId) } : prev);
    setIsDirty(true);
  }

  // ─── Popovers ────────────────────────────────────────────────────────────────
  function openTablePopover(t: CanvasTable, el: HTMLElement) {
    setSelectedTableId(t.id); setSelectedObjectId(null); setPopoverObject(null); setPopoverTable(t);
    const rect = el.getBoundingClientRect();
    let x = rect.right + 8, y = rect.top;
    if (x + 270 > window.innerWidth - 20) x = rect.left - 278;
    if (y + 380 > window.innerHeight) y = window.innerHeight - 390;
    if (y < 70) y = 70;
    setPopoverPos({ x, y });
  }

  function openObjectPopover(o: CanvasObject, el: HTMLElement) {
    setSelectedObjectId(o.id); setSelectedTableId(null); setPopoverTable(null); setPopoverObject(o);
    const rect = el.getBoundingClientRect();
    let x = rect.right + 8, y = rect.top;
    if (x + 270 > window.innerWidth - 20) x = rect.left - 278;
    if (y + 200 > window.innerHeight) y = window.innerHeight - 210;
    if (y < 70) y = 70;
    setPopoverPos({ x, y });
  }

  function closePopovers() { setSelectedTableId(null); setSelectedObjectId(null); setPopoverTable(null); setPopoverObject(null); }

  // ─── Table actions ───────────────────────────────────────────────────────────
  function deleteTableById(id: number) {
    const t = tables.find(t => t.id === id);
    if (!t) return;
    if (t.guests.length > 0 && !confirm(`בשולחן יש ${t.guests.length} אורחים. הם יחזרו לרשימה. למחוק?`)) return;
    pushHistory(tables, objects, venueFrame);
    setTables(prev => prev.filter(t => t.id !== id));
    closePopovers(); setIsDirty(true);
  }

  function duplicateTable(id: number) {
    const orig = tables.find(t => t.id === id);
    if (!orig) return;
    pushHistory(tables, objects, venueFrame);
    const num = orig.shape === "couple" ? null : nextTableNumber;
    if (orig.shape !== "couple") setNextTableNumber(n => n + 1);
    setTables(prev => [...prev, { ...orig, id: nextTempId(), dbId: undefined, number: num, guests: [], x: orig.x + 40, y: orig.y + 40 }]);
    setIsDirty(true); closePopovers();
  }

  function resetTableSize(id: number) {
    pushHistory(tables, objects, venueFrame);
    setTables(prev => prev.map(t => t.id === id ? { ...t, customW: undefined, customH: undefined } : t));
    setPopoverTable(prev => prev && prev.id === id ? { ...prev, customW: undefined, customH: undefined } : prev);
    setIsDirty(true);
  }

  function changeTableSeats(id: number, seats: number) {
    const n = Math.max(1, Math.min(30, seats));
    setTables(prev => prev.map(t => t.id === id ? { ...t, seats: n } : t));
    setPopoverTable(prev => prev && prev.id === id ? { ...prev, seats: n } : prev);
    setIsDirty(true);
  }

  function changeTableNumber(id: number, num: number) {
    const n = Math.max(1, Math.min(999, num));
    setTables(prev => {
      const other = prev.find(t => t.id !== id && t.number === n);
      const thisTable = prev.find(t => t.id === id);
      return prev.map(t => {
        if (t.id === id) return { ...t, number: n };
        if (other && t.id === other.id) return { ...t, number: thisTable?.number ?? null };
        return t;
      });
    });
    setPopoverTable(prev => prev && prev.id === id ? { ...prev, number: n } : prev);
    setIsDirty(true);
  }

  function changeTableName(id: number, name: string) {
    setTables(prev => prev.map(t => t.id === id ? { ...t, name } : t));
    setPopoverTable(prev => prev && prev.id === id ? { ...prev, name } : prev);
    setIsDirty(true);
  }

  // ─── Object actions ──────────────────────────────────────────────────────────
  function deleteObjectById(id: number) {
    pushHistory(tables, objects, venueFrame);
    setObjects(prev => prev.filter(o => o.id !== id));
    closePopovers(); setIsDirty(true);
  }

  function duplicateObject(id: number) {
    const orig = objects.find(o => o.id === id);
    if (!orig) return;
    pushHistory(tables, objects, venueFrame);
    setObjects(prev => [...prev, { ...orig, id: nextTempId(), dbId: undefined, name: orig.name ? `${orig.name} (עותק)` : "", x: orig.x + 40, y: orig.y + 40 }]);
    setIsDirty(true); closePopovers();
  }

  function changeObjectName(id: number, name: string) {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, name } : o));
    setPopoverObject(prev => prev && prev.id === id ? { ...prev, name } : prev);
    setIsDirty(true);
  }

  // ─── Venue frame ─────────────────────────────────────────────────────────────
  function applyVenueFrame() {
    if (venueInput.w < 3 || venueInput.h < 3 || venueInput.w > 100 || venueInput.h > 100) { toast.error("מידות תקינות: 3–100 מטרים"); return; }
    pushHistory(tables, objects, venueFrame);
    const wrap = canvasWrapRef.current;
    const cx = wrap ? wrap.clientWidth / 2 / zoom : 300;
    const cy = wrap ? wrap.clientHeight / 2 / zoom : 300;
    setVenueFrame({ widthM: venueInput.w, heightM: venueInput.h, x: cx, y: cy });
    setShowVenueModal(false); setIsDirty(true);
  }

  // ─── Guests helpers ──────────────────────────────────────────────────────────
  const seatedIds = useMemo(() => new Set(tables.flatMap(t => t.guests)), [tables]);

  const filteredGuests = useMemo(() => {
    let list = guests;
    if (guestFilter === "unseated") list = list.filter(g => !seatedIds.has(g.id));
    if (guestSearch) list = list.filter(g => g.name.toLowerCase().includes(guestSearch.toLowerCase()) || (g.group ?? "").toLowerCase().includes(guestSearch.toLowerCase()));
    return list;
  }, [guests, guestFilter, guestSearch, seatedIds]);

  const totalGuests = useMemo(() => guests.reduce((s, g) => s + g.count, 0), [guests]);
  const seatedCount = useMemo(() => tables.flatMap(t => t.guests).reduce((s, gid) => {
    const g = guests.find(g => g.id === gid);
    return s + (g ? g.count : 0);
  }, 0), [tables, guests]);
  const unseatedBadge = useMemo(() => guests.filter(g => !seatedIds.has(g.id)).length, [guests, seatedIds]);

  useEffect(() => {
    if (popoverTable) {
      const updated = tables.find(t => t.id === popoverTable.id);
      if (updated) setPopoverTable(updated);
    }
  }, [tables]);

  function ResizeHandles({ kind, id }: { kind: "table" | "object"; id: number }) {
    const dirs = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];
    return (
      <>
        {dirs.map(dir => (
          <div key={dir} className={`resize-handle ${dir}`} onMouseDown={e => startResize(e, kind, id, dir)} />
        ))}
      </>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
        <div style={{ color: "#5D6861", fontSize: 18 }}>טוען פריסת ישיבה...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif", direction: "rtl" }}>
      <style>{`
        * { box-sizing: border-box; }
        .canvas-wrap { flex: 1; overflow: auto; position: relative; background: #EDEAE4; }
        .canvas-inner { position: relative; min-width: 1400px; min-height: 900px; transform-origin: top right; }
        .table-el { position: absolute; cursor: grab; user-select: none; display: flex; align-items: center; justify-content: center; transition: box-shadow 0.15s; }
        .table-el:active { cursor: grabbing; }
        .table-el.shape-round { border-radius: 50%; background: #C8D8CC; border: 2px solid #8FAF97; }
        .table-el.shape-rect { border-radius: 8px; background: #C8D8CC; border: 2px solid #8FAF97; }
        .table-el.shape-couple { border-radius: 40px; background: #D9C5A1; border: 2px solid #B8A07A; }
        .table-el.full { background: #A8C3B0 !important; border-color: #5D8A6A !important; }
        .table-el.empty { background: #E8E4DC; border: 2px dashed #B0ADA5; }
        .table-el.selected { box-shadow: 0 0 0 3px #3F4842, 0 4px 20px rgba(63,72,66,0.3); z-index: 10; }
        .table-el.drop-target { box-shadow: 0 0 0 3px #5D6861, 0 0 20px rgba(93,104,97,0.4); }
        .table-body { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; pointer-events: none; }
        .table-number { font-size: 18px; font-weight: 700; color: #2D2D2D; font-family: 'Frank Ruhl Libre', serif; line-height: 1; }
        .table-name { font-size: 11px; color: #5D6861; margin-top: 2px; text-align: center; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .table-occ { font-size: 11px; color: #5D6861; margin-top: 2px; }
        .canvas-object-el { position: absolute; cursor: grab; user-select: none; display: flex; align-items: center; justify-content: center; }
        .canvas-object-el.shape-rect { border-radius: 8px; background: #E0DAC9; border: 1.5px dashed #8B8B85; }
        .canvas-object-el.shape-circle { border-radius: 50%; background: #E0DAC9; border: 1.5px dashed #8B8B85; }
        .canvas-object-el.selected { box-shadow: 0 0 0 2px #3F4842; z-index: 10; }
        .canvas-object-body { font-size: 12px; color: #5D6861; text-align: center; pointer-events: none; padding: 4px; }
        .venue-frame { position: absolute; border: 2px dashed #8FAF97; pointer-events: none; }
        .venue-frame-label { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 11px; color: #5D6861; white-space: nowrap; }
        .resize-handle { position: absolute; width: 12px; height: 12px; background: #fff; border: 2px solid #3F4842; border-radius: 3px; z-index: 20; }
        .resize-handle.nw { top: -6px; right: -6px; cursor: nesw-resize; }
        .resize-handle.ne { top: -6px; left: -6px; cursor: nwse-resize; }
        .resize-handle.sw { bottom: -6px; right: -6px; cursor: nwse-resize; }
        .resize-handle.se { bottom: -6px; left: -6px; cursor: nesw-resize; }
        .resize-handle.n { top: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
        .resize-handle.s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
        .resize-handle.e { left: -6px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
        .resize-handle.w { right: -6px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
        .resize-handle:hover { background: #3F4842; }
        .toolbar { width: 220px; flex-shrink: 0; background: #F0EDE6; border-left: 1px solid #DDD8CE; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 16px; }
        .guests-panel { width: 240px; flex-shrink: 0; background: #F0EDE6; border-right: 1px solid #DDD8CE; display: flex; flex-direction: column; overflow: hidden; }
        .toolbar-section-title { font-size: 11px; font-weight: 700; color: #8FAF97; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .table-template { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 12px; border: 1.5px solid #DDD8CE; background: #fff; cursor: grab; margin-bottom: 6px; transition: border-color 0.15s, box-shadow 0.15s; }
        .table-template:hover { border-color: #8FAF97; box-shadow: 0 2px 8px rgba(63,72,66,0.1); }
        .shape-preview-round { width: 32px; height: 32px; border-radius: 50%; background: #C8D8CC; border: 2px solid #8FAF97; flex-shrink: 0; }
        .shape-preview-rect { width: 40px; height: 22px; border-radius: 5px; background: #C8D8CC; border: 2px solid #8FAF97; flex-shrink: 0; }
        .shape-preview-couple { width: 40px; height: 18px; border-radius: 20px; background: #D9C5A1; border: 2px solid #B8A07A; flex-shrink: 0; }
        .shape-preview-obj-rect { width: 40px; height: 22px; border-radius: 5px; background: #E0DAC9; border: 1.5px dashed #8B8B85; flex-shrink: 0; }
        .shape-preview-obj-circle { width: 28px; height: 28px; border-radius: 50%; background: #E0DAC9; border: 1.5px dashed #8B8B85; flex-shrink: 0; }
        .seats-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .seats-stepper { width: 24px; height: 24px; border: 1px solid #DDD8CE; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .seats-input { width: 44px; border: 1px solid #DDD8CE; border-radius: 6px; padding: 2px 6px; text-align: center; font-size: 13px; }
        .guests-header { padding: 12px; border-bottom: 1px solid #DDD8CE; }
        .guests-title { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 700; color: #2D2D2D; margin-bottom: 8px; }
        .guests-badge { background: #3F4842; color: #fff; border-radius: 20px; padding: 1px 8px; font-size: 11px; }
        .guests-search { width: 100%; border: 1px solid #DDD8CE; border-radius: 8px; padding: 6px 10px; font-size: 13px; background: #fff; margin-bottom: 8px; }
        .guests-filter { display: flex; gap: 4px; }
        .filter-btn { padding: 3px 10px; border-radius: 20px; border: 1px solid #DDD8CE; background: #fff; font-size: 12px; cursor: pointer; color: #5D6861; }
        .filter-btn.active { background: #3F4842; color: #fff; border-color: #3F4842; }
        .guests-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
        .guest-card { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; border: 1px solid #DDD8CE; background: #fff; cursor: grab; transition: border-color 0.15s; }
        .guest-card.seated { opacity: 0.5; cursor: default; }
        .guest-card:not(.seated):hover { border-color: #8FAF97; }
        .guest-side-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .guest-info { flex: 1; min-width: 0; }
        .guest-name { font-size: 13px; font-weight: 600; color: #2D2D2D; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .guest-meta { font-size: 11px; color: #8B8B85; }
        .guest-count { font-size: 12px; font-weight: 700; color: #5D6861; background: #E8E4DC; border-radius: 20px; padding: 1px 8px; flex-shrink: 0; }
        .seated-badge { font-size: 11px; color: #5D8A6A; background: #D4EAD8; border-radius: 20px; padding: 1px 8px; flex-shrink: 0; }
        .topbar { height: 52px; background: #3F4842; display: flex; align-items: center; padding: 0 16px; gap: 12px; flex-shrink: 0; }
        .topbar-title { color: #F8F6F2; font-size: 14px; font-weight: 600; flex: 1; }
        .topbar-stat { color: rgba(248,246,242,0.7); font-size: 12px; display: flex; gap: 4px; }
        .topbar-stat .num { color: #F8F6F2; font-weight: 700; }
        .top-btn { padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(248,246,242,0.3); background: transparent; color: #F8F6F2; font-size: 12px; cursor: pointer; font-family: 'Heebo', sans-serif; transition: background 0.15s; }
        .top-btn:hover { background: rgba(248,246,242,0.1); }
        .top-btn.primary { background: #A8C3B0; border-color: #A8C3B0; color: #2D2D2D; font-weight: 700; }
        .top-btn.primary:hover { background: #8FAF97; }
        .top-btn:disabled { opacity: 0.4; cursor: default; }
        .canvas-controls { position: absolute; bottom: 16px; left: 16px; display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #DDD8CE; border-radius: 20px; padding: 4px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 5; }
        .canvas-btn { width: 28px; height: 28px; border: none; background: none; cursor: pointer; font-size: 16px; color: #5D6861; border-radius: 6px; }
        .canvas-btn:hover { background: #F0EDE6; }
        .zoom-label { font-size: 12px; color: #5D6861; min-width: 36px; text-align: center; }
        .popover { position: fixed; z-index: 1000; background: #fff; border: 1px solid #DDD8CE; border-radius: 14px; box-shadow: 0 8px 32px rgba(63,72,66,0.15); padding: 14px; width: 260px; direction: rtl; }
        .popover-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .popover-title { font-size: 14px; font-weight: 700; color: #2D2D2D; }
        .popover-close { width: 24px; height: 24px; border: none; background: none; cursor: pointer; color: #8B8B85; font-size: 16px; border-radius: 6px; }
        .popover-close:hover { background: #F0EDE6; }
        .popover-occ { display: flex; justify-content: space-between; font-size: 12px; color: #5D6861; background: #F0EDE6; border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; }
        .popover-label { font-size: 11px; font-weight: 700; color: #8B8B85; margin-bottom: 4px; }
        .popover-input { width: 100%; border: 1px solid #DDD8CE; border-radius: 8px; padding: 5px 8px; font-size: 13px; margin-bottom: 8px; font-family: 'Heebo', sans-serif; }
        .popover-guests { max-height: 120px; overflow-y: auto; margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px; }
        .popover-guest { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; border-radius: 8px; background: #F0EDE6; font-size: 12px; }
        .popover-remove { border: none; background: none; cursor: pointer; color: #B05050; font-size: 14px; padding: 0 4px; }
        .popover-empty { font-size: 12px; color: #B0ADA5; text-align: center; padding: 12px; }
        .popover-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .popover-btn { padding: 4px 10px; border-radius: 20px; border: 1px solid #DDD8CE; background: #fff; font-size: 12px; cursor: pointer; color: #5D6861; font-family: 'Heebo', sans-serif; }
        .popover-btn:hover { border-color: #8FAF97; }
        .popover-btn.danger { color: #B05050; }
        .popover-btn.danger:hover { border-color: #B05050; background: #FFF0F0; }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 2000; display: flex; align-items: center; justify-content: center; }
        .modal-box { background: #fff; border-radius: 18px; padding: 24px; width: 320px; direction: rtl; }
        .modal-title { font-size: 16px; font-weight: 700; color: #2D2D2D; margin-bottom: 6px; }
        .modal-sub { font-size: 12px; color: #8B8B85; margin-bottom: 16px; line-height: 1.5; }
        .modal-field { margin-bottom: 12px; }
        .modal-field label { font-size: 12px; font-weight: 700; color: #5D6861; display: block; margin-bottom: 4px; }
        .modal-input { border: 1px solid #DDD8CE; border-radius: 8px; padding: 6px 10px; font-size: 14px; width: 100%; }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
        .modal-btn { padding: 6px 16px; border-radius: 20px; border: 1px solid #DDD8CE; background: #fff; font-size: 13px; cursor: pointer; font-family: 'Heebo', sans-serif; }
        .modal-btn.primary { background: #3F4842; color: #fff; border-color: #3F4842; }
        .modal-btn.danger { color: #B05050; border-color: #B05050; }
        @media (max-width: 768px) {
          .seating-body { display: none; }
          .small-screen-msg { display: flex !important; }
        }
      `}</style>

      {/* Small screen */}
      <div style={{ display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", textAlign: "center", padding: 24 }} className="small-screen-msg">
        <div style={{ fontSize: 40, marginBottom: 16 }}>🖥️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#2D2D2D", marginBottom: 8 }}>סידורי ישיבה זמינים במחשב בלבד</h2>
        <p style={{ color: "#5D6861" }}>המסך הזה דורש מסך רחב לעבודה נוחה עם השולחנות.</p>
      </div>

      <div className="seating-body" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Top bar */}
        <div className="topbar">
          <span className="topbar-title">סידורי ישיבה</span>
          <div className="topbar-stat"><span>סה״כ:</span><span className="num">{totalGuests}</span></div>
          <div className="topbar-stat"><span>משובצים:</span><span className="num">{seatedCount}</span></div>
          <div className="topbar-stat"><span>ממתינים:</span><span className="num">{totalGuests - seatedCount}</span></div>
          <button className="top-btn" onClick={undo} disabled={historyRef.current.length === 0}>↶ חזור</button>
          <button className="top-btn" onClick={() => { setVenueInput(venueFrame ? { w: venueFrame.widthM, h: venueFrame.heightM } : { w: 20, h: 30 }); setShowVenueModal(true); }}>📐 גודל אולם</button>
          <button className="top-btn primary" onClick={handleSave} disabled={isSaving || !isDirty}>{isSaving ? "שומר..." : "💾 שמירה"}</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left toolbar */}
          <div className="toolbar">
            <div>
              <div className="toolbar-section-title">הוספת שולחן</div>

              <div className="table-template" draggable onDragStart={() => onTemplateDragStart("table", "round", defaultSeats.round)}>
                <div className="shape-preview-round" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>שולחן עגול</div>
                  <div style={{ fontSize: 11, color: "#8B8B85" }}>{defaultSeats.round} כיסאות</div>
                </div>
              </div>
              <div className="seats-row">
                <span style={{ fontSize: 11, color: "#8B8B85" }}>כיסאות:</span>
                <button className="seats-stepper" onClick={() => setDefaultSeats(s => ({ ...s, round: Math.max(1, s.round - 1) }))}>−</button>
                <input className="seats-input" type="number" value={defaultSeats.round} min={1} max={30} onChange={e => setDefaultSeats(s => ({ ...s, round: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) }))} />
                <button className="seats-stepper" onClick={() => setDefaultSeats(s => ({ ...s, round: Math.min(30, s.round + 1) }))}>+</button>
              </div>

              <div className="table-template" draggable onDragStart={() => onTemplateDragStart("table", "rect", defaultSeats.rect)}>
                <div className="shape-preview-rect" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>שולחן ארוך</div>
                  <div style={{ fontSize: 11, color: "#8B8B85" }}>{defaultSeats.rect} כיסאות</div>
                </div>
              </div>
              <div className="seats-row">
                <span style={{ fontSize: 11, color: "#8B8B85" }}>כיסאות:</span>
                <button className="seats-stepper" onClick={() => setDefaultSeats(s => ({ ...s, rect: Math.max(1, s.rect - 1) }))}>−</button>
                <input className="seats-input" type="number" value={defaultSeats.rect} min={1} max={30} onChange={e => setDefaultSeats(s => ({ ...s, rect: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) }))} />
                <button className="seats-stepper" onClick={() => setDefaultSeats(s => ({ ...s, rect: Math.min(30, s.rect + 1) }))}>+</button>
              </div>

              <div className="table-template" draggable onDragStart={() => onTemplateDragStart("table", "couple", defaultSeats.couple)}>
                <div className="shape-preview-couple" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>שולחן זוג</div>
                  <div style={{ fontSize: 11, color: "#8B8B85" }}>{defaultSeats.couple} כיסאות</div>
                </div>
              </div>
              <div className="seats-row">
                <span style={{ fontSize: 11, color: "#8B8B85" }}>כיסאות:</span>
                <button className="seats-stepper" onClick={() => setDefaultSeats(s => ({ ...s, couple: Math.max(1, s.couple - 1) }))}>−</button>
                <input className="seats-input" type="number" value={defaultSeats.couple} min={1} max={10} onChange={e => setDefaultSeats(s => ({ ...s, couple: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) }))} />
                <button className="seats-stepper" onClick={() => setDefaultSeats(s => ({ ...s, couple: Math.min(10, s.couple + 1) }))}>+</button>
              </div>
            </div>

            <div>
              <div className="toolbar-section-title">אובייקטים</div>
              <div className="table-template" draggable onDragStart={() => onTemplateDragStart("object", "rect")}>
                <div className="shape-preview-obj-rect" />
                <div style={{ fontSize: 13, color: "#5D6861" }}>מלבן (במה / בר)</div>
              </div>
              <div className="table-template" draggable onDragStart={() => onTemplateDragStart("object", "circle")}>
                <div className="shape-preview-obj-circle" />
                <div style={{ fontSize: 13, color: "#5D6861" }}>עיגול (עמוד)</div>
              </div>
            </div>

            <div>
              <div className="toolbar-section-title">מקרא</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5D6861", marginBottom: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#C8D8CC", border: "2px solid #8FAF97", flexShrink: 0 }} />
                <span>שולחן עם מקום</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5D6861", marginBottom: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#A8C3B0", border: "2px solid #5D8A6A", flexShrink: 0 }} />
                <span>שולחן מלא</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5D6861" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#E8E4DC", border: "2px dashed #B0ADA5", flexShrink: 0 }} />
                <span>שולחן ריק</span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#B0ADA5", lineHeight: 1.7 }}>
              💡 גרור שולחן לקנבס<br />
              💡 גרור אורח לשולחן<br />
              💡 לחץ על שולחן לעריכה<br />
              💡 Ctrl+Z — ביטול<br />
              💡 Ctrl+S — שמירה
            </div>
          </div>

          {/* Canvas */}
          <div className="canvas-wrap" ref={canvasWrapRef} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop} onClick={closePopovers}>
            <div className="canvas-inner" style={{ transform: `scale(${zoom})`, transformOrigin: "top right" }}>
              {venueFrame && (
                <div
                  className="venue-frame"
                  style={{
                    left: venueFrame.x - (venueFrame.widthM * METERS_TO_PX) / 2,
                    top: venueFrame.y - (venueFrame.heightM * METERS_TO_PX) / 2,
                    width: venueFrame.widthM * METERS_TO_PX,
                    height: venueFrame.heightM * METERS_TO_PX,
                  }}
                >
                  <div className="venue-frame-label">{venueFrame.widthM} × {venueFrame.heightM} מ׳</div>
                </div>
              )}

              {objects.map(o => {
                const isSelected = selectedObjectId === o.id;
                return (
                  <div
                    key={o.id}
                    className={`canvas-object-el shape-${o.shape}${isSelected ? " selected" : ""}`}
                    style={{ left: o.x - o.w / 2, top: o.y - o.h / 2, width: o.w, height: o.h }}
                    onMouseDown={e => onObjectMouseDown(e, o)}
                    onClick={e => { e.stopPropagation(); openObjectPopover(o, e.currentTarget as HTMLElement); }}
                  >
                    <div className="canvas-object-body">{o.name || <span style={{ color: "#C0BDB5" }}>ללא שם</span>}</div>
                    {isSelected && <ResizeHandles kind="object" id={o.id} />}
                  </div>
                );
              })}

              {tables.map(t => {
                const { w, h } = getTableSize(t);
                const { occupied, total } = getOccupancy(t, guests);
                const isFull = occupied >= total;
                const isEmpty = occupied === 0;
                const isSelected = selectedTableId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`table-el shape-${t.shape}${isFull ? " full" : ""}${isEmpty ? " empty" : ""}${isSelected ? " selected" : ""}`}
                    style={{ left: t.x - w / 2, top: t.y - h / 2, width: w, height: h }}
                    onMouseDown={e => onTableMouseDown(e, t)}
                    onClick={e => { e.stopPropagation(); openTablePopover(t, e.currentTarget as HTMLElement); }}
                    onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add("drop-target"); }}
                    onDragLeave={e => (e.currentTarget as HTMLElement).classList.remove("drop-target")}
                    onDrop={e => { (e.currentTarget as HTMLElement).classList.remove("drop-target"); onTableDrop(e, t.id); }}
                  >
                    <div className="table-body">
                      <div className="table-number">{t.shape === "couple" ? "♥" : t.number}</div>
                      {t.name && <div className="table-name">{t.name}</div>}
                      <div className="table-occ">{occupied}/{total}</div>
                    </div>
                    {isSelected && <ResizeHandles kind="table" id={t.id} />}
                  </div>
                );
              })}
            </div>

            {/* Zoom controls */}
            <div className="canvas-controls">
              <button className="canvas-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>−</button>
              <span className="zoom-label">{Math.round(zoom * 100)}%</span>
              <button className="canvas-btn" onClick={() => setZoom(z => Math.min(1.8, z + 0.1))}>+</button>
              <div style={{ width: 1, background: "#DDD8CE", margin: "4px 2px" }} />
              <button className="canvas-btn" onClick={() => setZoom(1)} title="איפוס">⌂</button>
            </div>
          </div>

          {/* Right guests panel */}
          <div className="guests-panel">
            <div className="guests-header">
              <div className="guests-title">
                <span>אורחים לשיבוץ</span>
                <span className="guests-badge">{unseatedBadge}</span>
              </div>
              <input className="guests-search" placeholder="חיפוש לפי שם..." value={guestSearch} onChange={e => setGuestSearch(e.target.value)} />
              <div className="guests-filter">
                <button className={`filter-btn${guestFilter === "unseated" ? " active" : ""}`} onClick={() => setGuestFilter("unseated")}>לא משובצים</button>
                <button className={`filter-btn${guestFilter === "all" ? " active" : ""}`} onClick={() => setGuestFilter("all")}>הכל</button>
              </div>
            </div>
            <div className="guests-list">
              {filteredGuests.length === 0 ? (
                <div style={{ textAlign: "center", color: "#B0ADA5", padding: 24, fontSize: 13 }}>
                  {guestFilter === "unseated" && unseatedBadge === 0 ? "🎉 כל האורחים שובצו!" : "אין אורחים תואמים"}
                </div>
              ) : filteredGuests.map(g => {
                const seated = seatedIds.has(g.id);
                return (
                  <div
                    key={g.id}
                    className={`guest-card${seated ? " seated" : ""}`}
                    draggable={!seated}
                    onDragStart={() => !seated && onGuestDragStart(g.id)}
                  >
                    <div className="guest-side-dot" style={{ background: g.side === "shared" ? "#A8C3B0" : g.side ? "#D9C5A1" : "#C8D8CC" }} />
                    <div className="guest-info">
                      <div className="guest-name">{g.name}</div>
                      {g.group && <div className="guest-meta">{g.group}</div>}
                    </div>
                    {seated ? <span className="seated-badge">✓</span> : <span className="guest-count">{g.count}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table popover */}
      {popoverTable && (
        <div className="popover" style={{ left: popoverPos.x, top: popoverPos.y }} onClick={e => e.stopPropagation()}>
          <div className="popover-header">
            <div className="popover-title">
              {popoverTable.shape === "couple" ? "♥ שולחן זוג" : popoverTable.shape === "rect" ? `שולחן ארוך ${popoverTable.number ?? ""}` : `שולחן עגול ${popoverTable.number ?? ""}`}
            </div>
            <button className="popover-close" onClick={closePopovers}>✕</button>
          </div>
          <div className="popover-occ">
            <span>תפוסה</span>
            <span><strong>{getOccupancy(popoverTable, guests).occupied}</strong> / {popoverTable.seats} כיסאות</span>
          </div>
          {popoverTable.shape !== "couple" && (
            <>
              <div className="popover-label">מספר שולחן:</div>
              <input className="popover-input" type="number" value={popoverTable.number ?? ""} min={1} max={999} onChange={e => changeTableNumber(popoverTable.id, parseInt(e.target.value) || 1)} />
            </>
          )}
          <div className="popover-label">שם שולחן:</div>
          <input className="popover-input" placeholder="שם אופציונלי..." value={popoverTable.name} onChange={e => changeTableName(popoverTable.id, e.target.value)} />
          <div className="popover-label">מספר כיסאות:</div>
          <div className="seats-row" style={{ marginBottom: 8 }}>
            <button className="seats-stepper" onClick={() => changeTableSeats(popoverTable.id, popoverTable.seats - 1)}>−</button>
            <input className="seats-input" type="number" value={popoverTable.seats} min={1} max={30} onChange={e => changeTableSeats(popoverTable.id, parseInt(e.target.value) || 1)} />
            <button className="seats-stepper" onClick={() => changeTableSeats(popoverTable.id, popoverTable.seats + 1)}>+</button>
          </div>
          <div className="popover-label">אורחים בשולחן:</div>
          <div className="popover-guests">
            {popoverTable.guests.length === 0
              ? <div className="popover-empty">גרור אורחים לכאן</div>
              : popoverTable.guests.map(gid => {
                  const g = guests.find(g => g.id === gid);
                  if (!g) return null;
                  return (
                    <div key={gid} className="popover-guest">
                      <span>{g.name} <span style={{ color: "#B0ADA5" }}>({g.count})</span></span>
                      <button className="popover-remove" onClick={() => removeGuestFromTable(gid, popoverTable.id)}>✕</button>
                    </div>
                  );
                })
            }
          </div>
          <div className="popover-actions">
            <button className="popover-btn" onClick={() => duplicateTable(popoverTable.id)}>שכפול</button>
            {popoverTable.customW && <button className="popover-btn" onClick={() => resetTableSize(popoverTable.id)}>איפוס גודל</button>}
            <button className="popover-btn danger" onClick={() => deleteTableById(popoverTable.id)}>מחיקה</button>
          </div>
        </div>
      )}

      {/* Object popover */}
      {popoverObject && (
        <div className="popover" style={{ left: popoverPos.x, top: popoverPos.y }} onClick={e => e.stopPropagation()}>
          <div className="popover-header">
            <div className="popover-title">{popoverObject.shape === "rect" ? "מלבן" : "עיגול"}</div>
            <button className="popover-close" onClick={closePopovers}>✕</button>
          </div>
          <div className="popover-label">שם:</div>
          <input className="popover-input" placeholder="למשל: במה, בר, עמוד..." value={popoverObject.name} onChange={e => changeObjectName(popoverObject.id, e.target.value)} autoFocus />
          <div className="popover-actions">
            <button className="popover-btn" onClick={() => duplicateObject(popoverObject.id)}>שכפול</button>
            <button className="popover-btn danger" onClick={() => deleteObjectById(popoverObject.id)}>מחיקה</button>
          </div>
        </div>
      )}

      {/* Venue size modal */}
      {showVenueModal && (
        <div className="modal-backdrop" onClick={() => setShowVenueModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📐 גודל האולם</div>
            <div className="modal-sub">הזן מידות האולם במטרים. מסגרת תצוייר על הקנבס. כל מטר = {METERS_TO_PX} פיקסלים.</div>
            <div className="modal-field">
              <label>רוחב (מטרים)</label>
              <input className="modal-input" type="number" min={3} max={100} value={venueInput.w} onChange={e => setVenueInput(v => ({ ...v, w: parseInt(e.target.value) || 20 }))} />
            </div>
            <div className="modal-field">
              <label>אורך (מטרים)</label>
              <input className="modal-input" type="number" min={3} max={100} value={venueInput.h} onChange={e => setVenueInput(v => ({ ...v, h: parseInt(e.target.value) || 30 }))} />
            </div>
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setShowVenueModal(false)}>ביטול</button>
              {venueFrame && <button className="modal-btn danger" onClick={() => { pushHistory(tables, objects, venueFrame); setVenueFrame(null); setShowVenueModal(false); setIsDirty(true); }}>הסתרה</button>}
              <button className="modal-btn primary" onClick={applyVenueFrame}>הצגה</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
