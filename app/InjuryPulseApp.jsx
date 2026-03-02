import { useState, useEffect, useCallback } from "react";

// ─── STATUS CONFIG ───
const statusConfig = {
  injured: { label: "Sakat", color: "#FF3B30", bg: "rgba(255,59,48,0.12)", icon: "🏥", pulse: "pulseRed" },
  suspended: { label: "Cezalı", color: "#AF52DE", bg: "rgba(175,82,222,0.12)", icon: "🟥", pulse: "pulsePurple" },
  at_risk: { label: "Kart Riski", color: "#FF9500", bg: "rgba(255,149,0,0.12)", icon: "🟨", pulse: "pulseYellow" },
  doubtful: { label: "Şüpheli", color: "#FFCC00", bg: "rgba(255,204,0,0.12)", icon: "⚠️", pulse: "pulseAmber" },
  fit: { label: "Hazır", color: "#30D158", bg: "rgba(48,209,88,0.12)", icon: "✅", pulse: "" },
};

function getDaysUntil(d) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / 864e5);
  return diff > 0 ? diff : 0;
}

// ─── DEMO DATA (used before first real scrape) ───
const DEMO_LEAGUES = {
  laliga: {
    name: "La Liga", country: "İspanya", icon: "🇪🇸", sport: "football",
    color: "#FF4B44", gradient: "linear-gradient(135deg, #FF4B44, #D62828)",
    teams: [
      { name: "Real Madrid", badge: "⚪", stars: [
        { name: "Vinícius Jr.", pos: "LW", num: 7, flag: "🇧🇷", status: "fit", injury: null, returnDate: null, cards: { yellow: 3, red: 0 }, cardLimit: 5 },
        { name: "Jude Bellingham", pos: "CM", num: 5, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", status: "injured", injury: "Hamstring strain", returnDate: "2026-03-20", cards: { yellow: 2, red: 0 }, cardLimit: 5 },
        { name: "Kylian Mbappé", pos: "ST", num: 9, flag: "🇫🇷", status: "at_risk", injury: null, returnDate: null, cards: { yellow: 4, red: 0 }, cardLimit: 5 },
      ]},
      { name: "FC Barcelona", badge: "🔵", stars: [
        { name: "Lamine Yamal", pos: "RW", num: 19, flag: "🇪🇸", status: "injured", injury: "Ankle sprain", returnDate: "2026-03-15", cards: { yellow: 1, red: 0 }, cardLimit: 5 },
        { name: "Raphinha", pos: "LW", num: 11, flag: "🇧🇷", status: "fit", injury: null, returnDate: null, cards: { yellow: 2, red: 0 }, cardLimit: 5 },
        { name: "Robert Lewandowski", pos: "ST", num: 9, flag: "🇵🇱", status: "suspended", injury: null, returnDate: "2026-03-08", cards: { yellow: 5, red: 0 }, cardLimit: 5 },
      ]},
      { name: "Atlético Madrid", badge: "🔴", stars: [
        { name: "Antoine Griezmann", pos: "ST", num: 7, flag: "🇫🇷", status: "fit", injury: null, returnDate: null, cards: { yellow: 1, red: 0 }, cardLimit: 5 },
        { name: "Julián Álvarez", pos: "ST", num: 19, flag: "🇦🇷", status: "at_risk", injury: null, returnDate: null, cards: { yellow: 4, red: 0 }, cardLimit: 5 },
        { name: "Alexander Sörloth", pos: "ST", num: 9, flag: "🇳🇴", status: "doubtful", injury: "Knee discomfort", returnDate: "2026-03-05", cards: { yellow: 2, red: 0 }, cardLimit: 5 },
      ]},
    ],
  },
  seriea: {
    name: "Serie A", country: "İtalya", icon: "🇮🇹", sport: "football",
    color: "#008C45", gradient: "linear-gradient(135deg, #008C45, #006233)",
    teams: [
      { name: "Inter Milan", badge: "⚫", stars: [
        { name: "Lautaro Martínez", pos: "ST", num: 10, flag: "🇦🇷", status: "fit", injury: null, returnDate: null, cards: { yellow: 3, red: 0 }, cardLimit: 5 },
        { name: "Marcus Thuram", pos: "ST", num: 9, flag: "🇫🇷", status: "suspended", injury: null, returnDate: "2026-03-08", cards: { yellow: 5, red: 0 }, cardLimit: 5 },
        { name: "Nicolò Barella", pos: "CM", num: 23, flag: "🇮🇹", status: "at_risk", injury: null, returnDate: null, cards: { yellow: 4, red: 0 }, cardLimit: 5 },
      ]},
      { name: "Juventus", badge: "⚪", stars: [
        { name: "Dušan Vlahović", pos: "ST", num: 9, flag: "🇷🇸", status: "injured", injury: "Groin injury", returnDate: "2026-03-22", cards: { yellow: 3, red: 0 }, cardLimit: 5 },
        { name: "Kenan Yıldız", pos: "LW", num: 10, flag: "🇹🇷", status: "fit", injury: null, returnDate: null, cards: { yellow: 2, red: 0 }, cardLimit: 5 },
        { name: "Teun Koopmeiners", pos: "CM", num: 8, flag: "🇳🇱", status: "suspended", injury: null, returnDate: "2026-03-09", cards: { yellow: 0, red: 1 }, cardLimit: 5 },
      ]},
      { name: "AC Milan", badge: "🔴", stars: [
        { name: "Rafael Leão", pos: "LW", num: 10, flag: "🇵🇹", status: "fit", injury: null, returnDate: null, cards: { yellow: 2, red: 0 }, cardLimit: 5 },
        { name: "Christian Pulisic", pos: "RW", num: 11, flag: "🇺🇸", status: "doubtful", injury: "Ankle knock", returnDate: "2026-03-04", cards: { yellow: 1, red: 0 }, cardLimit: 5 },
        { name: "Theo Hernández", pos: "LB", num: 19, flag: "🇫🇷", status: "at_risk", injury: null, returnDate: null, cards: { yellow: 4, red: 0 }, cardLimit: 5 },
      ]},
    ],
  },
  bundesliga: {
    name: "Bundesliga", country: "Almanya", icon: "🇩🇪", sport: "football",
    color: "#D20515", gradient: "linear-gradient(135deg, #D20515, #9B0410)",
    teams: [
      { name: "Bayern Munich", badge: "🔴", stars: [
        { name: "Harry Kane", pos: "ST", num: 9, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", status: "fit", injury: null, returnDate: null, cards: { yellow: 2, red: 0 }, cardLimit: 5 },
        { name: "Jamal Musiala", pos: "AM", num: 42, flag: "🇩🇪", status: "at_risk", injury: null, returnDate: null, cards: { yellow: 4, red: 0 }, cardLimit: 5 },
        { name: "Leroy Sané", pos: "RW", num: 10, flag: "🇩🇪", status: "injured", injury: "Knee surgery", returnDate: "2026-03-28", cards: { yellow: 1, red: 0 }, cardLimit: 5 },
      ]},
      { name: "Bayer Leverkusen", badge: "⚫", stars: [
        { name: "Florian Wirtz", pos: "AM", num: 10, flag: "🇩🇪", status: "fit", injury: null, returnDate: null, cards: { yellow: 1, red: 0 }, cardLimit: 5 },
        { name: "Granit Xhaka", pos: "CM", num: 34, flag: "🇨🇭", status: "suspended", injury: null, returnDate: "2026-03-08", cards: { yellow: 5, red: 0 }, cardLimit: 5 },
        { name: "Victor Boniface", pos: "ST", num: 14, flag: "🇳🇬", status: "injured", injury: "Muscle injury", returnDate: "2026-03-12", cards: { yellow: 2, red: 0 }, cardLimit: 5 },
      ]},
      { name: "Borussia Dortmund", badge: "🟡", stars: [
        { name: "Donyell Malen", pos: "RW", num: 21, flag: "🇳🇱", status: "fit", injury: null, returnDate: null, cards: { yellow: 3, red: 0 }, cardLimit: 5 },
        { name: "Julian Brandt", pos: "AM", num: 10, flag: "🇩🇪", status: "at_risk", injury: null, returnDate: null, cards: { yellow: 4, red: 0 }, cardLimit: 5 },
        { name: "Karim Adeyemi", pos: "LW", num: 27, flag: "🇩🇪", status: "injured", injury: "Foot bruise", returnDate: "2026-03-10", cards: { yellow: 0, red: 0 }, cardLimit: 5 },
      ]},
    ],
  },
  euroleague: {
    name: "EuroLeague", country: "Avrupa", icon: "🏀", sport: "basketball",
    color: "#F26522", gradient: "linear-gradient(135deg, #F26522, #C44F15)",
    teams: [
      { name: "Fenerbahçe Beko", badge: "🟡", stars: [
        { name: "Nigel Hayes-Davis", pos: "PF", num: 2, flag: "🇺🇸", status: "fit", injury: null, returnDate: null },
        { name: "Nick Calathes", pos: "PG", num: 33, flag: "🇬🇷", status: "injured", injury: "Achilles tendinitis", returnDate: "2026-03-18" },
        { name: "Bonzie Colson", pos: "PF", num: 35, flag: "🇺🇸", status: "doubtful", injury: "Ankle twist", returnDate: "2026-03-05" },
      ]},
      { name: "Anadolu Efes", badge: "🔵", stars: [
        { name: "Shane Larkin", pos: "PG", num: 0, flag: "🇺🇸", status: "fit", injury: null, returnDate: null },
        { name: "Elijah Bryant", pos: "SG", num: 4, flag: "🇺🇸", status: "injured", injury: "Shoulder dislocation", returnDate: "2026-03-22" },
        { name: "Vincent Poirier", pos: "C", num: 17, flag: "🇫🇷", status: "injured", injury: "Knee surgery", returnDate: "2026-06-01" },
      ]},
      { name: "Real Madrid Baloncesto", badge: "⚪", stars: [
        { name: "Facundo Campazzo", pos: "PG", num: 11, flag: "🇦🇷", status: "fit", injury: null, returnDate: null },
        { name: "Mario Hezonja", pos: "SF", num: 8, flag: "🇭🇷", status: "injured", injury: "Calf strain", returnDate: "2026-03-20" },
        { name: "Walter Tavares", pos: "C", num: 22, flag: "🇨🇻", status: "fit", injury: null, returnDate: null },
      ]},
      { name: "Olympiacos", badge: "🔴", stars: [
        { name: "Sasha Vezenkov", pos: "SF", num: 8, flag: "🇧🇬", status: "fit", injury: null, returnDate: null },
        { name: "Evan Fournier", pos: "SG", num: 10, flag: "🇫🇷", status: "injured", injury: "Knee soreness", returnDate: "2026-03-12" },
        { name: "Thomas Walkup", pos: "PG", num: 0, flag: "🇺🇸", status: "injured", injury: "Hamstring", returnDate: "2026-03-15" },
      ]},
      { name: "Panathinaikos", badge: "🟢", stars: [
        { name: "Kendrick Nunn", pos: "PG", num: 12, flag: "🇺🇸", status: "fit", injury: null, returnDate: null },
        { name: "Mathias Lessort", pos: "C", num: 26, flag: "🇫🇷", status: "injured", injury: "Knee surgery", returnDate: "2026-04-01" },
        { name: "Jerian Grant", pos: "PG", num: 2, flag: "🇺🇸", status: "fit", injury: null, returnDate: null },
      ]},
      { name: "FC Barcelona Basket", badge: "🔵", stars: [
        { name: "Kevin Punter", pos: "SG", num: 0, flag: "🇺🇸", status: "fit", injury: null, returnDate: null },
        { name: "Willy Hernangómez", pos: "C", num: 14, flag: "🇪🇸", status: "doubtful", injury: "Back spasms", returnDate: "2026-03-08" },
        { name: "Nicolas Laprovittola", pos: "PG", num: 20, flag: "🇦🇷", status: "fit", injury: null, returnDate: null },
      ]},
    ],
  },
};

// ─── CREATIVE SUGGESTION ───
function getCreative(player, team, league) {
  const isBball = league.sport === "basketball";
  const s = player.status;
  if (s === "injured") { const d = getDaysUntil(player.returnDate); return { priority:"critical", title:`🏥 "${player.name} Geri Sayım"`, desc:`${d!=null?d+" gün sonra dönüş":"Dönüş belirsiz"}`, formats:[{icon:"📱",label:"Countdown Story"},{icon:"🎬",label:"Comeback Reels"},{icon:"📊",label:"Miss Tracker"},{icon:"🔔",label:"Push Bildirim"}], tags:["Story","Post","Reels"] }; }
  if (s === "suspended") return { priority:"high", title:`🟥 "${player.name} Cezalı"`, desc:player.cards?.red>0?"Kırmızı kart cezası":`Sarı kart birikimi (${player.cards?.yellow||"?"}/${player.cardLimit||5})`, formats:[{icon:"📋",label:"Alternatif XI"},{icon:"📊",label:"Ceza İnfografik"},{icon:"🗳️",label:"Fan Poll"},{icon:"⏰",label:"Dönüş Postu"}], tags:["Story","Poll","Infographic"] };
  if (s === "at_risk") return { priority:"high", title:`🟨 "${player.name} Kart Sınırında!"`, desc:`${player.cards?.yellow||"?"}/${player.cardLimit||5} sarı kart`, formats:[{icon:"⚠️",label:"Uyarı Story"},{icon:"📊",label:"Kart Tracker"},{icon:"🗳️",label:"Poll"},{icon:"🎬",label:"Faul Compilation"}], tags:["Story","Poll","Reels"] };
  if (s === "doubtful") return { priority:"medium", title:`⚠️ "${player.name} Şüpheli"`, desc:`Maç günü kararı bekleniyor`, formats:[{icon:"🗳️",label:"Poll Story"},{icon:"⚡",label:"Breaking Update"},{icon:"📱",label:"Push"},{icon:"💬",label:"Thread"}], tags:["Story","Poll","Push"] };
  return { priority:"low", title:`✅ "${player.name} Formda"`, desc:isBball?"Tam performans":"Tam performans", formats:[{icon:"🌟",label:"Spotlight"},{icon:"📸",label:"Matchday Visual"},{icon:"🎥",label:"Highlight Reel"},{icon:"📊",label:"Stat Carousel"}], tags:["Post","Carousel","Reels"] };
}

// ─── CARD BAR ───
function CardBar({ cards, limit }) {
  if (!cards) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5 }}>
      {Array.from({length:limit}).map((_,i)=>(
        <div key={i} style={{ width:13, height:17, borderRadius:2, background:i<cards.yellow?"#FFCC00":cards.red>0&&i===0?"#FF3B30":"rgba(255,255,255,.07)", border:i<cards.yellow?"1px solid rgba(255,204,0,.5)":"1px solid rgba(255,255,255,.05)", transition:"all .3s" }} />
      ))}
      {cards.red>0 && <div style={{ width:13, height:17, borderRadius:2, background:"#FF3B30", border:"1px solid rgba(255,59,48,.5)", marginLeft:3 }} />}
      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:cards.yellow>=limit-1?"#FF9500":"rgba(255,255,255,.25)", fontWeight:cards.yellow>=limit-1?700:400 }}>
        {cards.yellow}/{limit}{cards.yellow>=limit-1&&!cards.red&&" ⚠️"}
      </span>
    </div>
  );
}

// ─── MAIN APP ───
export default function InjuryPulseApp() {
  const [activeLeague, setActiveLeague] = useState("laliga");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openCreative, setOpenCreative] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Data & refresh state
  const [leagues, setLeagues] = useState(DEMO_LEAGUES);
  const [dataSource, setDataSource] = useState("demo");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);
  const [refreshError, setRefreshError] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  // ─── REFRESH HANDLER ───
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshResult(null);

    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const result = await res.json();

      if (result.success && result.data) {
        const liveData = result.data;
        // Transform scraped data into app format
        const updated = JSON.parse(JSON.stringify(DEMO_LEAGUES));

        // For each football league, update player statuses from real data
        for (const [leagueKey, leagueData] of Object.entries(liveData.football || {})) {
          if (!updated[leagueKey]) continue;
          const scrapedPlayers = leagueData.all || [];

          updated[leagueKey].teams.forEach(team => {
            team.stars.forEach(player => {
              // Try to find this player in scraped data
              const normalizedPlayerName = player.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
              const match = scrapedPlayers.find(sp => {
                const normalizedScraped = sp.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                // Match by last name or full name
                return normalizedScraped.includes(normalizedPlayerName) ||
                       normalizedPlayerName.includes(normalizedScraped) ||
                       normalizedPlayerName.split(' ').some(part => part.length > 3 && normalizedScraped.includes(part)) ||
                       normalizedScraped.split(' ').some(part => part.length > 3 && normalizedPlayerName.includes(part));
              });

              if (match) {
                // Player found in injury/suspension list — update status
                player.status = match.status;
                player.injury = match.info || match.injury || null;
                player.returnDate = match.returnDate || null;
                if (match.status === 'suspended') {
                  player.cards = match.reason === 'red_card' 
                    ? { yellow: player.cards?.yellow || 0, red: 1 }
                    : { yellow: player.cardLimit || 5, red: 0 };
                }
              } else {
                // Player NOT in any injury/suspension list = FIT and available
                player.status = 'fit';
                player.injury = null;
                player.returnDate = null;
              }
            });
          });
        }

        // EuroLeague: update from basketball data
        if (liveData.basketball?.euroleague?.injuries?.length > 0) {
          const euroInjuries = liveData.basketball.euroleague.injuries;
          updated.euroleague.teams.forEach(team => {
            team.stars.forEach(player => {
              const normalizedPlayerName = player.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
              const match = euroInjuries.find(sp => {
                const ns = sp.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                return ns.includes(normalizedPlayerName) || normalizedPlayerName.includes(ns) ||
                       normalizedPlayerName.split(' ').some(p => p.length > 3 && ns.includes(p));
              });
              if (match) {
                player.status = match.status || 'injured';
                player.injury = match.injury || 'Undisclosed';
              } else {
                player.status = 'fit';
                player.injury = null;
                player.returnDate = null;
              }
            });
          });
        }

        setLeagues(updated);
        setLastUpdated(new Date().toLocaleString('tr-TR'));
        setDataSource("live");
        setRefreshResult({
          football: Object.fromEntries(
            Object.entries(liveData.football || {}).map(([k, v]) => [k, {
              injuries: v.injured?.length || 0,
              suspensions: v.suspended?.length || 0,
              total: v.totalCount || 0,
            }])
          ),
          euroleague: { injuries: liveData.basketball?.euroleague?.injuries?.length || 0 },
          sources: liveData.sources || [],
        });
        setTimeout(() => setRefreshResult(null), 10000);
      } else {
        setRefreshError(result.error || 'Veri çekme başarısız');
        setTimeout(() => setRefreshError(null), 6000);
      }
    } catch (err) {
      setRefreshError('Bağlantı hatası: ' + err.message);
      setTimeout(() => setRefreshError(null), 6000);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const league = leagues[activeLeague];
  const isBasketball = league.sport === "basketball";

  const allPlayers = Object.values(leagues).flatMap(l => l.teams.flatMap(t => t.stars));
  const counts = {
    injured: allPlayers.filter(p => p.status==="injured").length,
    suspended: allPlayers.filter(p => p.status==="suspended").length,
    at_risk: allPlayers.filter(p => p.status==="at_risk").length,
    doubtful: allPlayers.filter(p => p.status==="doubtful").length,
    fit: allPlayers.filter(p => p.status==="fit").length,
  };

  const filterOpts = isBasketball
    ? [{k:"all",l:"Tümü"},{k:"injured",l:"🏥 Sakat"},{k:"doubtful",l:"⚠️ Şüpheli"},{k:"fit",l:"✅ Hazır"}]
    : [{k:"all",l:"Tümü"},{k:"injured",l:"🏥 Sakat"},{k:"suspended",l:"🟥 Cezalı"},{k:"at_risk",l:"🟨 Risk"},{k:"doubtful",l:"⚠️ Şüpheli"},{k:"fit",l:"✅ Hazır"}];

  const filteredTeams = league.teams
    .map(t => ({...t, stars: t.stars.filter(p => {
      const ms = filter==="all"||p.status===filter;
      const mq = !search||p.name.toLowerCase().includes(search.toLowerCase())||t.name.toLowerCase().includes(search.toLowerCase());
      return ms && mq;
    })}))
    .filter(t => t.stars.length > 0);

  const prioColors = { critical:"#FF3B30", high:"#FF9500", medium:"#FFCC00", low:"#30D158" };
  const prioLabels = { critical:"KRİTİK", high:"ÖNCELİKLİ", medium:"ORTA", low:"DÜŞÜK" };

  return (
    <div style={{ minHeight:"100vh", background:"#07070C", color:"#E4E4E9", fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes pulseRed{0%,100%{box-shadow:0 0 0 0 rgba(255,59,48,.35)}50%{box-shadow:0 0 0 7px rgba(255,59,48,0)}}
        @keyframes pulsePurple{0%,100%{box-shadow:0 0 0 0 rgba(175,82,222,.35)}50%{box-shadow:0 0 0 7px rgba(175,82,222,0)}}
        @keyframes pulseYellow{0%,100%{box-shadow:0 0 0 0 rgba(255,149,0,.35)}50%{box-shadow:0 0 0 7px rgba(255,149,0,0)}}
        @keyframes pulseAmber{0%,100%{box-shadow:0 0 0 0 rgba(255,204,0,.35)}50%{box-shadow:0 0 0 7px rgba(255,204,0,0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .fu{animation:fadeUp .4s ease forwards}
        .fu1{animation:fadeUp .4s ease .07s forwards;opacity:0}
        .fu2{animation:fadeUp .4s ease .14s forwards;opacity:0}
        .fu3{animation:fadeUp .4s ease .21s forwards;opacity:0}
        .spin{animation:spin 1s linear infinite}
        .slide-in{animation:slideIn .35s ease forwards}

        .ltab{padding:9px 18px;border-radius:11px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02);cursor:pointer;transition:all .22s;font-size:13px;font-weight:600;color:rgba(255,255,255,.4);display:flex;align-items:center;gap:7px;white-space:nowrap;font-family:'DM Sans',sans-serif}
        .ltab:hover{background:rgba(255,255,255,.05);color:rgba(255,255,255,.65)}
        .ltab.on{border-color:var(--lc);color:#fff;background:rgba(255,255,255,.055)}
        .card{background:rgba(255,255,255,.018);border:1px solid rgba(255,255,255,.055);border-radius:15px;overflow:hidden;transition:all .22s;cursor:pointer}
        .card:hover{border-color:rgba(255,255,255,.1);transform:translateY(-1px)}
        .prow{display:flex;align-items:center;gap:13px;padding:13px 18px;border-top:1px solid rgba(255,255,255,.035);transition:background .18s}
        .prow:hover{background:rgba(255,255,255,.02)}
        .dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
        .fp{padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);color:rgba(255,255,255,.4);font-size:12px;font-weight:600;cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif}
        .fp:hover{background:rgba(255,255,255,.05)}
        .fp.on{background:rgba(255,255,255,.09);color:#fff;border-color:rgba(255,255,255,.16)}
        .sb{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:9px 15px 9px 36px;color:#fff;font-size:13px;width:100%;max-width:280px;outline:none;transition:border-color .2s;font-family:'DM Sans',sans-serif}
        .sb:focus{border-color:rgba(255,255,255,.16)}
        .sb::placeholder{color:rgba(255,255,255,.18)}
        .cbtn{padding:5px 12px;border-radius:7px;background:linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.55);font-size:11px;font-weight:700;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:4px;font-family:'DM Sans',sans-serif;white-space:nowrap}
        .cbtn:hover{background:linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.05));color:#fff}
        .stbox{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.045);border-radius:13px;padding:16px 12px;text-align:center}
        .fmtbox{padding:10px;background:rgba(255,255,255,.02);border-radius:9px;border:1px solid rgba(255,255,255,.035);transition:all .18s;font-size:12px}
        .fmtbox:hover{background:rgba(255,255,255,.04)}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.07);border-radius:2px}

        .refresh-btn{display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:11px;border:1px solid rgba(255,255,255,.08);cursor:pointer;transition:all .25s;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;white-space:nowrap}
        .refresh-btn:hover{transform:translateY(-1px)}
        .refresh-btn:active{transform:translateY(0)}
        .refresh-btn.idle{background:linear-gradient(135deg,rgba(48,209,88,.12),rgba(48,209,88,.04));color:#30D158;border-color:rgba(48,209,88,.2)}
        .refresh-btn.idle:hover{background:linear-gradient(135deg,rgba(48,209,88,.18),rgba(48,209,88,.08));box-shadow:0 0 20px rgba(48,209,88,.12)}
        .refresh-btn.loading{background:rgba(255,255,255,.04);color:rgba(255,255,255,.5);border-color:rgba(255,255,255,.08);pointer-events:none}
        .refresh-btn.error{background:rgba(255,59,48,.08);color:#FF3B30;border-color:rgba(255,59,48,.15)}
        .refresh-btn.success{background:rgba(48,209,88,.08);color:#30D158;border-color:rgba(48,209,88,.15)}
      `}</style>

      {/* Ambient */}
      <div style={{ position:"fixed",top:"-25%",right:"-8%",width:500,height:500,background:`radial-gradient(circle,${league.color}10,transparent 70%)`,pointerEvents:"none",transition:"background .5s" }} />

      <div style={{ position:"relative",zIndex:2,maxWidth:1100,margin:"0 auto",padding:"0 18px" }}>

        {/* ─── HEADER ─── */}
        <header className={mounted?"fu":""} style={{ padding:"28px 0 20px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14 }}>
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
                <div style={{ width:32,height:32,borderRadius:8,background:league.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#fff",fontWeight:800 }}>⚕</div>
                <h1 style={{ fontSize:21,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-0.5px" }}>
                  INJURY<span style={{ color:league.color }}>PULSE</span>
                </h1>
                <span style={{ fontSize:9,padding:"2px 7px",borderRadius:4,background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.3)",fontWeight:700 }}>v3.0</span>
              </div>
              <p style={{ fontSize:11,color:"rgba(255,255,255,.25)",fontFamily:"'JetBrains Mono',monospace" }}>
                Sakatlık + Kart Cezası Takip & Kreatif Öneri
              </p>
            </div>

            {/* ─── REFRESH BUTTON + STATUS ─── */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
              <button
                className={`refresh-btn ${isRefreshing?"loading":refreshError?"error":refreshResult?"success":"idle"}`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <><span className="spin" style={{ display:"inline-block" }}>⟳</span> Veriler Çekiliyor...</>
                ) : refreshError ? (
                  <><span>✕</span> Hata — Tekrar Dene</>
                ) : refreshResult ? (
                  <><span>✓</span> Güncellendi!</>
                ) : (
                  <><span>⟳</span> Verileri Güncelle</>
                )}
              </button>

              <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:10,fontFamily:"'JetBrains Mono',monospace" }}>
                <div style={{ width:6,height:6,borderRadius:3,background:dataSource==="live"?"#30D158":dataSource==="demo"?"#FF9500":"#FF3B30" }} />
                <span style={{ color:"rgba(255,255,255,.3)" }}>
                  {dataSource==="live"?"Canlı Veri":"Demo Veri"}
                  {lastUpdated && ` · ${lastUpdated}`}
                </span>
              </div>
            </div>
          </div>

          {/* Refresh result toast */}
          {refreshResult && (
            <div className="slide-in" style={{
              marginTop:12, padding:"12px 16px", borderRadius:11,
              background:"rgba(48,209,88,.06)", border:"1px solid rgba(48,209,88,.12)",
              fontSize:12, color:"rgba(255,255,255,.6)",
              display:"flex", gap:16, flexWrap:"wrap", alignItems:"center",
            }}>
              <span style={{ color:"#30D158", fontWeight:700 }}>✓ Veri başarıyla çekildi</span>
              {Object.entries(refreshResult.football||{}).map(([k,v]) => (
                <span key={k} style={{ color:"rgba(255,255,255,.4)", fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>
                  {k}: {v.injuries||0} sakat · {v.suspensions||0} cezalı · {v.cardRisk||0} risk
                </span>
              ))}
              {refreshResult.euroleague && (
                <span style={{ color:"rgba(255,255,255,.4)", fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>
                  euroleague: {refreshResult.euroleague.injuries||0} sakat
                </span>
              )}
            </div>
          )}

          {refreshError && (
            <div className="slide-in" style={{
              marginTop:12, padding:"12px 16px", borderRadius:11,
              background:"rgba(255,59,48,.06)", border:"1px solid rgba(255,59,48,.12)",
              fontSize:12, color:"#FF3B30",
            }}>
              ✕ {refreshError}
            </div>
          )}
        </header>

        <div style={{ height:1,background:`linear-gradient(90deg,transparent,${league.color}50,transparent)`,marginBottom:20 }} />

        {/* ─── CRON INFO ─── */}
        <div className={mounted?"fu1":""} style={{
          padding:"10px 16px", borderRadius:10, marginBottom:16,
          background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.04)",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8,
        }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>
            <span style={{ fontWeight:700, color:"rgba(255,255,255,.5)" }}>⏰ Otomatik Güncelleme:</span> Maç günleri 10:00 & 20:00 (Salı-Pazar)
          </div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.25)", fontFamily:"'JetBrains Mono',monospace" }}>
            Kaynak: {isBasketball?"BasketNews + EuroLeague.net":"Transfermarkt"}
          </div>
        </div>

        {/* ─── STATS ─── */}
        <div className={mounted?"fu1":""} style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:9,marginBottom:20 }}>
          {[
            {l:"Sakat",v:counts.injured,c:"#FF3B30"},
            {l:"Cezalı",v:counts.suspended,c:"#AF52DE"},
            {l:"Kart Riski",v:counts.at_risk,c:"#FF9500"},
            {l:"Şüpheli",v:counts.doubtful,c:"#FFCC00"},
            {l:"Hazır",v:counts.fit,c:"#30D158"},
          ].map(s=>(
            <div key={s.l} className="stbox">
              <div style={{ fontSize:24,fontWeight:800,color:s.c,fontFamily:"'JetBrains Mono',monospace" }}>{s.v}</div>
              <div style={{ fontSize:10,color:"rgba(255,255,255,.3)",marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ─── LEAGUE TABS ─── */}
        <div className={mounted?"fu2":""} style={{ display:"flex",gap:7,marginBottom:16,overflowX:"auto",paddingBottom:2,"--lc":league.color }}>
          {Object.entries(leagues).map(([k,l])=>(
            <button key={k} className={`ltab ${activeLeague===k?"on":""}`}
              onClick={()=>{setActiveLeague(k);setExpandedTeam(null);setFilter("all")}}
              style={activeLeague===k?{"--lc":l.color,borderColor:l.color}:{}}>
              <span>{l.icon}</span>{l.name}
            </button>
          ))}
        </div>

        {isBasketball && (
          <div style={{ padding:"9px 14px",background:"rgba(242,101,34,.07)",border:"1px solid rgba(242,101,34,.12)",borderRadius:9,marginBottom:14,fontSize:11,color:"rgba(255,255,255,.45)" }}>
            🏀 Basketbolda kart cezası sistemi yoktur — sadece sakatlık takibi
          </div>
        )}

        {/* ─── FILTERS ─── */}
        <div className={mounted?"fu3":""} style={{ display:"flex",gap:7,marginBottom:20,flexWrap:"wrap",alignItems:"center" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,.2)",fontSize:12 }}>🔍</span>
            <input className="sb" placeholder="Oyuncu veya takım ara..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
            {filterOpts.map(f=>(<button key={f.k} className={`fp ${filter===f.k?"on":""}`} onClick={()=>setFilter(f.k)}>{f.l}</button>))}
          </div>
        </div>

        {/* ─── TEAMS ─── */}
        <div style={{ display:"flex",flexDirection:"column",gap:10,paddingBottom:40 }}>
          {filteredTeams.map(team=>{
            const open = expandedTeam===team.name;
            const inj=team.stars.filter(p=>p.status==="injured").length;
            const sus=team.stars.filter(p=>p.status==="suspended").length;
            const risk=team.stars.filter(p=>p.status==="at_risk").length;
            const dbt=team.stars.filter(p=>p.status==="doubtful").length;
            return (
              <div key={team.name} className="card" style={{ borderColor:open?`${league.color}30`:undefined }}>
                <div onClick={()=>setExpandedTeam(open?null:team.name)} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:11 }}>
                    <span style={{ fontSize:18 }}>{team.badge}</span>
                    <div>
                      <div style={{ fontSize:14,fontWeight:700 }}>{team.name}</div>
                      <div style={{ display:"flex",gap:7,marginTop:3,flexWrap:"wrap" }}>
                        {inj>0&&<span style={{ fontSize:10,color:"#FF3B30",fontWeight:600 }}>{inj} sakat</span>}
                        {sus>0&&<span style={{ fontSize:10,color:"#AF52DE",fontWeight:600 }}>{sus} cezalı</span>}
                        {risk>0&&<span style={{ fontSize:10,color:"#FF9500",fontWeight:600 }}>{risk} kart riski</span>}
                        {dbt>0&&<span style={{ fontSize:10,color:"#FFCC00",fontWeight:600 }}>{dbt} şüpheli</span>}
                        {inj===0&&sus===0&&risk===0&&dbt===0&&<span style={{ fontSize:10,color:"#30D158",fontWeight:600 }}>Tüm yıldızlar hazır ✓</span>}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize:15,color:"rgba(255,255,255,.2)",transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .22s" }}>▾</span>
                </div>

                {open && team.stars.map(player=>{
                  const cfg=statusConfig[player.status];
                  const daysLeft=getDaysUntil(player.returnDate);
                  const creative=getCreative(player,team,league);
                  const cOpen=openCreative===`${team.name}::${player.name}`;
                  return (
                    <div key={player.name}>
                      <div className="prow">
                        <div className={`dot ${cfg.pulse}`} style={{ background:cfg.color }} />
                        <div style={{ width:38,height:38,borderRadius:9,background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0 }}>{player.flag}</div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:7,flexWrap:"wrap" }}>
                            <span style={{ fontWeight:700,fontSize:13 }}>{player.name}</span>
                            <span style={{ fontSize:10,color:"rgba(255,255,255,.22)",fontFamily:"'JetBrains Mono',monospace" }}>#{player.num} · {player.pos}</span>
                          </div>
                          <div style={{ display:"flex",alignItems:"center",gap:7,marginTop:3,flexWrap:"wrap" }}>
                            <span style={{ padding:"2px 8px",borderRadius:5,background:cfg.bg,color:cfg.color,fontSize:10,fontWeight:700 }}>{cfg.icon} {cfg.label}</span>
                            {player.injury&&<span style={{ fontSize:11,color:"rgba(255,255,255,.35)" }}>{player.injury}</span>}
                            {daysLeft!=null&&daysLeft>0&&<span style={{ fontSize:10,color:"rgba(255,255,255,.22)",fontFamily:"'JetBrains Mono',monospace" }}>~{daysLeft}g</span>}
                          </div>
                          {!isBasketball&&player.cards&&<CardBar cards={player.cards} limit={player.cardLimit} />}
                        </div>
                        <button className="cbtn" onClick={e=>{e.stopPropagation();setOpenCreative(cOpen?null:`${team.name}::${player.name}`);}}>💡 Kreatif</button>
                      </div>

                      {cOpen && (
                        <div style={{ padding:"0 18px 16px" }}>
                          <div style={{ background:"linear-gradient(135deg,rgba(255,255,255,.035),rgba(255,255,255,.012))", border:"1px solid rgba(255,255,255,.06)", borderLeft:`3px solid ${prioColors[creative.priority]}`, borderRadius:13, padding:18 }}>
                            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10 }}>
                              <div>
                                <div style={{ fontSize:13,fontWeight:700,marginBottom:4 }}>{creative.title}</div>
                                <div style={{ fontSize:11,color:"rgba(255,255,255,.4)",lineHeight:1.5 }}>{creative.desc}</div>
                              </div>
                              <div style={{ padding:"3px 9px",borderRadius:5,fontSize:9,fontWeight:800,letterSpacing:.5,whiteSpace:"nowrap", background:`${prioColors[creative.priority]}15`,color:prioColors[creative.priority] }}>
                                {prioLabels[creative.priority]}
                              </div>
                            </div>
                            <div style={{ display:"flex",gap:4,marginBottom:12,flexWrap:"wrap" }}>
                              {creative.tags.map(t=>(<span key={t} style={{ padding:"2px 8px",borderRadius:5,fontSize:9,fontWeight:700,background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.35)" }}>{t}</span>))}
                            </div>
                            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7 }}>
                              {creative.formats.map((f,i)=>(<div key={i} className="fmtbox">{f.icon} <span style={{ color:"rgba(255,255,255,.6)",fontWeight:600 }}>{f.label}</span></div>))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {filteredTeams.length===0&&(
            <div style={{ textAlign:"center",padding:45,color:"rgba(255,255,255,.2)" }}>
              <div style={{ fontSize:32,marginBottom:8 }}>🔍</div><div style={{ fontSize:12 }}>Sonuç bulunamadı</div>
            </div>
          )}
        </div>

        <div style={{ padding:"14px 0 28px",textAlign:"center",fontSize:9,color:"rgba(255,255,255,.12)",fontFamily:"'JetBrains Mono',monospace" }}>
          INJURYPULSE v3.0 — S Sport Plus Kreatif Ekibi
        </div>
      </div>
    </div>
  );
}
