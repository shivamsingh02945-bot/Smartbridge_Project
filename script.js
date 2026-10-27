const $ = (selector) => document.querySelector(selector);
const form = $("#trip-form");
const results = $("#results");
let currentPlan = null;
let toastTimer;

const places = {
  culture: [
    {icon:"🏛️", title:"Explore a local landmark", desc:"Visit a well-known historic site or museum. Take time to learn the story behind the place.", time:"9:00 AM", type:"Culture"},
    {icon:"🎨", title:"Discover the old town", desc:"Wander through heritage streets, architecture, and small galleries at your own pace.", time:"10:00 AM", type:"Culture"},
    {icon:"🕌", title:"Visit a heritage site", desc:"Explore a local monument or place of cultural importance. Check entry rules before you visit.", time:"3:00 PM", type:"Culture"},
    {icon:"📸", title:"Golden-hour photo walk", desc:"Find a scenic viewpoint and capture the details, colors, and everyday life of the destination.", time:"5:00 PM", type:"Culture"}
  ],
  food: [
    {icon:"☕", title:"Breakfast at a local café", desc:"Start slowly with regional breakfast favorites and a cup of something warm.", time:"8:30 AM", type:"Food"},
    {icon:"🍜", title:"Taste the local specialties", desc:"Try a popular regional dish at a well-reviewed local eatery. Ask about house specialties.", time:"1:00 PM", type:"Food"},
    {icon:"🥭", title:"Street-food discovery", desc:"Sample a few small bites from busy stalls with good food-safety practices.", time:"4:00 PM", type:"Food"},
    {icon:"🍽️", title:"A relaxed local dinner", desc:"Finish the day with regional cuisine. Reserve ahead if the place is popular.", time:"7:30 PM", type:"Food"}
  ],
  nature: [
    {icon:"🌿", title:"A refreshing nature walk", desc:"Find a nearby garden, lakeside path, or green space and enjoy a gentle start to the day.", time:"7:30 AM", type:"Nature"},
    {icon:"🏞️", title:"Scenic viewpoint", desc:"Head to a local viewpoint or natural landmark. Carry water and check conditions before setting out.", time:"10:00 AM", type:"Nature"},
    {icon:"🌅", title:"Sunset in a peaceful spot", desc:"Wind down at a waterfront, park, hilltop, or other scenic place near your destination.", time:"5:30 PM", type:"Nature"}
  ],
  adventure: [
    {icon:"🥾", title:"Get outdoors", desc:"Choose a suitable walking trail or outdoor activity. Match the difficulty to your fitness and check local guidance.", time:"8:00 AM", type:"Adventure"},
    {icon:"🚲", title:"Explore under your own steam", desc:"Try a guided cycle, kayak, or outdoor excursion from a reputable local operator.", time:"11:00 AM", type:"Adventure"},
    {icon:"🧭", title:"Take the scenic route", desc:"Explore a new neighborhood or natural area with time for unplanned stops.", time:"3:30 PM", type:"Adventure"}
  ],
  relax: [
    {icon:"🧘", title:"A slow morning", desc:"Leave room for a leisurely breakfast, a quiet café, or a peaceful walk without a fixed schedule.", time:"9:00 AM", type:"Relax"},
    {icon:"🌼", title:"A little time to recharge", desc:"Spend a few hours at a garden, spa, beach, or calm public space that suits your destination.", time:"2:00 PM", type:"Relax"},
    {icon:"🌇", title:"Unhurried evening", desc:"Pick a comfortable spot to watch the day end, then enjoy dinner close by.", time:"5:30 PM", type:"Relax"}
  ],
  shopping: [
    {icon:"🛍️", title:"Browse local markets", desc:"Look for regional crafts, textiles, and useful souvenirs. Compare prices before buying.", time:"10:00 AM", type:"Shopping"},
    {icon:"🧵", title:"Find something locally made", desc:"Explore independent shops and makers, and learn a little about the craft traditions.", time:"2:30 PM", type:"Shopping"},
    {icon:"🎁", title:"Souvenir stop", desc:"Pick up a small reminder of your trip and leave room in your bag for the journey home.", time:"4:30 PM", type:"Shopping"}
  ]
};

const destinationHints = {
  jaipur: {region:"Rajasthan, India", note:"heritage, colorful markets, and Rajasthani food"},
  goa: {region:"India", note:"beaches, Portuguese-influenced heritage, and coastal cuisine"},
  manali: {region:"Himachal Pradesh, India", note:"mountain scenery, fresh air, and outdoor adventures"},
  bhopal: {region:"Madhya Pradesh, India", note:"lakes, museums, green spaces, and central Indian flavors"},
  delhi: {region:"India", note:"monuments, bustling markets, and iconic street food"},
  agra: {region:"Uttar Pradesh, India", note:"world-famous architecture and Mughal heritage"},
  mumbai: {region:"Maharashtra, India", note:"coastal promenades, city culture, and diverse food"},
  kerala: {region:"India", note:"backwaters, lush landscapes, and regional cuisine"},
  udaipur: {region:"Rajasthan, India", note:"lake views, palaces, and atmospheric old streets"},
  rishikesh: {region:"Uttarakhand, India", note:"river scenery, yoga, and outdoor activities"},
  paris: {region:"France", note:"art, architecture, cafés, and neighborhood walks"},
  tokyo: {region:"Japan", note:"food culture, lively districts, and peaceful gardens"},
  london: {region:"United Kingdom", note:"museums, historic landmarks, and neighborhood discoveries"},
  bali: {region:"Indonesia", note:"tropical scenery, temples, and restorative escapes"}
};

const budgetRates = {
  budget: {stay:1000, food:600, transport:350, activities:350, label:"Budget"},
  moderate: {stay:2500, food:1200, transport:700, activities:900, label:"Comfortable"},
  premium: {stay:6500, food:2800, transport:1800, activities:2200, label:"Premium"}
};

function titleCase(text) {
  return text.trim().replace(/\s+/g, " ").replace(/\b[a-z]/g, c => c.toUpperCase());
}
function money(amount) {
  return new Intl.NumberFormat("en-IN", {style:"currency", currency:"INR", maximumFractionDigits:0}).format(amount);
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function getSelectedInterests() {
  return [...document.querySelectorAll('input[name="interest"]:checked')].map(el => el.value);
}
function chooseActivities(interests, dayIndex, pace) {
  const chosen = interests.length ? interests : ["culture", "food", "nature"];
  let activities = [];
  chosen.forEach(key => {
    const pool = places[key] || [];
    if (pool.length) activities.push(pool[(dayIndex + chosen.indexOf(key)) % pool.length]);
  });
  if (activities.length < 3) {
    ["food", "culture", "nature"].forEach(key => {
      if (activities.length < 4 && !chosen.includes(key)) activities.push(places[key][dayIndex % places[key].length]);
    });
  }
  activities = activities.slice(0, pace === "relaxed" ? 3 : pace === "packed" ? 5 : 4);
  if (pace === "packed" && activities.length < 5) {
    const extras = [...places.culture, ...places.food, ...places.nature];
    activities.push(extras[(dayIndex + 2) % extras.length]);
  }
  const timeSlots = pace === "relaxed" ? ["9:00 AM", "12:30 PM", "4:30 PM"] : pace === "packed" ? ["8:00 AM", "10:30 AM", "1:00 PM", "3:30 PM", "6:00 PM"] : ["9:00 AM", "11:30 AM", "2:00 PM", "5:00 PM"];
  return activities.map((activity, i) => ({...activity, time:timeSlots[i] || activity.time}));
}
function makePlan(data) {
  const destination = titleCase(data.get("destination"));
  const days = Number(data.get("days"));
  const budgetKey = data.get("budget");
  const pace = data.get("pace");
  const interests = getSelectedInterests();
  const rate = budgetRates[budgetKey];
  const hint = destinationHints[destination.toLowerCase()];
  const plans = [];
  const dayNames = ["Arrival & first impressions", "Local favorites", "Culture & discovery", "A little adventure", "Hidden corners", "Slow down & savor", "One last wander"];
  for (let d = 0; d < days; d++) {
    const activities = chooseActivities(interests, d, pace);
    if (d === 0) activities[0] = {...activities[0], title:"Get your bearings in " + destination, desc:"Settle in, explore the area around your stay, and get a feel for the neighborhood. " + (hint ? "Look out for " + hint.note + "." : "Ask a local for a favorite nearby spot.")};
    if (d === days - 1 && days > 1) activities[activities.length - 1] = {...activities[activities.length - 1], title:"A final taste of " + destination, desc:"Leave some time for a favorite revisit, a relaxed meal, and any last-minute souvenirs before you head home."};
    plans.push({number:d+1, title:dayNames[d] || "Explore at your own pace", subtitle:d === 0 ? "Arrive, settle in, and start exploring" : d === days-1 && days > 1 ? "Enjoy the last moments of your trip" : "A flexible day shaped around your interests", activities});
  }
  const multiplier = pace === "relaxed" ? .92 : pace === "packed" ? 1.18 : 1;
  const costs = {
    stay: Math.round(rate.stay * days * multiplier),
    food: Math.round(rate.food * days * multiplier),
    transport: Math.round(rate.transport * days * (pace === "relaxed" ? .8 : pace === "packed" ? 1.3 : 1)),
    activities: Math.round(rate.activities * days * (budgetKey === "budget" ? .8 : 1) * multiplier)
  };
  return {destination, days, budgetKey, pace, interests, rate, hint, plans, costs, total:Object.values(costs).reduce((a,b)=>a+b,0)};
}
function renderPlan(plan) {
  currentPlan = plan;
  $("#result-title").textContent = `${plan.days}-day escape to ${plan.destination}`;
  $("#result-subtitle").textContent = plan.hint ? `${plan.hint.region} · Inspired by ${plan.hint.note}` : `A flexible plan for exploring ${plan.destination}`;
  $("#summary-grid").innerHTML = `
    <div class="summary-item"><span>DESTINATION</span><strong>⌖ ${escapeHtml(plan.destination)}</strong></div>
    <div class="summary-item"><span>TRIP LENGTH</span><strong>☼ ${plan.days} ${plan.days === 1 ? "day" : "days"}</strong></div>
    <div class="summary-item"><span>TRAVEL STYLE</span><strong>${plan.rate.label} · ${titleCase(plan.pace)}</strong></div>`;
  $("#itinerary-days").innerHTML = plan.plans.map(day => `
    <article class="day-card">
      <div class="day-head"><div class="day-badge">DAY<br>${day.number}</div><div><h3>${escapeHtml(day.title)}</h3><p>${escapeHtml(day.subtitle)}</p></div></div>
      <div class="activity-list">${day.activities.map(activity => `
        <div class="activity"><time>${escapeHtml(activity.time)}</time><div class="activity-icon">${activity.icon}</div><div><strong>${escapeHtml(activity.title)}</strong><p>${escapeHtml(activity.desc)}</p><div class="activity-meta">${escapeHtml(activity.type)} · Suggested activity</div></div></div>`).join("")}
      </div>
    </article>`).join("");
  const rows = [
    ["Accommodation", plan.costs.stay],
    ["Food & drinks", plan.costs.food],
    ["Local transport", plan.costs.transport],
    ["Activities & entry fees", plan.costs.activities]
  ];
  $("#budget-breakdown").innerHTML = rows.map(([label, value]) => `<div class="budget-row"><span>${label}</span><strong>${money(value)}</strong></div>`).join("");
  $("#budget-total").textContent = money(plan.total);
  results.classList.remove("hidden");
  results.scrollIntoView({behavior:"smooth", block:"start"});
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const destination = $("#destination").value.trim();
  if (!destination) { showToast("Please enter a destination first."); $("#destination").focus(); return; }
  renderPlan(makePlan(new FormData(form)));
});
$("#save-button").addEventListener("click", () => {
  if (!currentPlan) return;
  try {
    localStorage.setItem("roamly-saved-plan", JSON.stringify(currentPlan));
    showToast("Your itinerary has been saved in this browser.");
    $("#save-button").textContent = "♥ Plan saved";
  } catch (error) {
    showToast("Your browser could not save this plan. Try printing it instead.");
  }
});
$("#print-button").addEventListener("click", () => window.print());
$("#new-plan-button").addEventListener("click", () => {
  $("#planner").scrollIntoView({behavior:"smooth", block:"start"});
  $("#destination").focus({preventScroll:true});
});
