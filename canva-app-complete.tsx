import { Button, Rows, Text, Title, LoadingIndicator } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import * as React from "react";

const BACKEND = "https://designflow-master.preview.emergentagent.com";
const STATUSES = ['PICKED','ORDER SAMPLES','SAMPLES ARRIVED','ASK NEIL','ASK CHARLENE','ASK JALA','GET QUOTE','WAITING ON QT','READY FOR PRESENTATION'];

export const App = () => {
  const [pid, setPid] = React.useState("");
  const [prj, setPrj] = React.useState<any>(null);
  const [load, setLoad] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [colR, setColR] = React.useState<Set<string>>(new Set());
  const [colC, setColC] = React.useState<Set<string>>(new Set());
  const [sync, setSync] = React.useState(new Date());

  // Real-time sync every 5 sec
  React.useEffect(() => {
    if (!prj) return;
    const i = setInterval(async () => {
      try {
        const r = await fetch(`${BACKEND}/api/projects/${pid}?sheet_type=checklist`);
        if (r.ok) { setPrj(await r.json()); setSync(new Date()); }
      } catch {}
    }, 5000);
    return () => clearInterval(i);
  }, [prj, pid]);

  const loadProj = async () => {
    if (!pid.trim()) return;
    setLoad(true); setErr("");
    try {
      const r = await fetch(`${BACKEND}/api/projects/${pid.trim()}?sheet_type=checklist`);
      if (!r.ok) throw new Error(`Failed: ${r.status}`);
      setPrj(await r.json());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoad(false);
    }
  };

  const updStat = async (iid: string, stat: string) => {
    try {
      await fetch(`${BACKEND}/api/items/${iid}`, {
        method: 