const MQTT_BROKER =
    "wss://trustee-track-breeeds-elect.trycloudflare.com";
const MQTT_USERNAME = "ayaan";
const MQTT_PASSWORD = "Kichu@040414";

const COMMAND_TOPIC = "ayaanglobals/esp32s3/001/command";
const STATE_TOPIC = "ayaanglobals/esp32s3/001/state";
const STATUS_TOPIC = "ayaanglobals/esp32s3/001/status";

const $ = (id) => document.getElementById(id);
const colorPicker = $("colorPicker");
let lastRGB = { r: 0, g: 80, b: 255 };

function clamp(v, min, max) { return Math.min(max, Math.max(min, Number(v))); }
function rgbToHex(r,g,b) { return "#" + [r,g,b].map(v => Number(v).toString(16).padStart(2,"0")).join("").toUpperCase(); }
function hexToRGB(hex) {
  const v = hex.replace("#", "");
  return { r: parseInt(v.slice(0,2),16), g: parseInt(v.slice(2,4),16), b: parseInt(v.slice(4,6),16) };
}
function showToast(text) {
  const t = $("toast"); t.textContent = text; t.classList.add("show");
  clearTimeout(window.__toast); window.__toast = setTimeout(() => t.classList.remove("show"), 1800);
}
function setConnection(online) {
  $("connectionStatus").textContent = online ? "ONLINE" : "OFFLINE";
  $("connectionDot").classList.toggle("online", online);
  $("statusBadge").textContent = online ? "CONNECTED" : "WAITING";
  $("statusBadge").classList.toggle("live", online);
}
function publish(payload, label) {
  if (!client.connected) { showToast("Device is offline"); return; }
  client.publish(COMMAND_TOPIC, JSON.stringify(payload));
  if (label) showToast(label);
}
function updatePreview(r,g,b) {
  lastRGB = {r,g,b};
  const hex = rgbToHex(r,g,b);
  $("orb").style.background = `rgb(${r},${g},${b})`;
  $("orbGlow").style.background = `rgb(${r},${g},${b})`;
  $("orbGlow").style.opacity = (Math.max(r,g,b) / 255) * 0.75;
  $("hexValue").textContent = hex;
  $("colorValue").textContent = hex;
  $("rgbValue").textContent = `${r} / ${g} / ${b}`;
  $("heroRGB").textContent = `${r}, ${g}, ${b}`;
}
function updateColorPicker(r,g,b) { colorPicker.value = rgbToHex(r,g,b).toLowerCase(); updatePreview(r,g,b); }
function selectEffect(effect) {
  document.querySelectorAll("[data-effect]").forEach(b => b.classList.toggle("selected", b.dataset.effect === effect));
  $("heroEffect").textContent = effect;
}

const client = mqtt.connect(MQTT_BROKER, {
  username: ayaan,
  password: Kichu@040414,
  reconnectPeriod: 3000,
  connectTimeout: 10000,
  clean: true
});

client.on("connect", () => {
  setConnection(true);
  client.subscribe([STATE_TOPIC, STATUS_TOPIC]);
  showToast("Connected to ESP32");
});
client.on("reconnect", () => setConnection(false));
client.on("close", () => setConnection(false));
client.on("offline", () => setConnection(false));
client.on("error", (err) => { console.error("MQTT:", err); setConnection(false); });
client.on("message", (topic, message) => {
  const value = message.toString();
  if (topic === STATUS_TOPIC) { setConnection(value === "online"); return; }
  if (topic !== STATE_TOPIC) return;
  try { applyState(JSON.parse(value)); } catch (e) { console.error("Bad state:", e); }
});

function applyState(state) {
  if (state.effect !== undefined) { $("stateEffect").textContent = state.effect; selectEffect(state.effect); }
  if (state.r !== undefined && state.g !== undefined && state.b !== undefined) {
    updateColorPicker(state.r, state.g, state.b);
    $("stateRGB").textContent = `${state.r}, ${state.g}, ${state.b}`;
  }
  if (state.brightness !== undefined) {
    $("brightness").value = clamp(state.brightness,0,100);
    $("brightnessValue").textContent = `${state.brightness}%`;
    $("stateBrightness").textContent = `${state.brightness}%`;
  }
  if (state.speed !== undefined) {
    $("speed").value = clamp(state.speed,0,100);
    $("speedValue").textContent = `${state.speed}%`;
    $("stateSpeed").textContent = `${state.speed}%`;
  }
  if (state.ip !== undefined) $("stateIP").textContent = state.ip;
  if (state.wifi_rssi !== undefined) $("stateRSSI").textContent = `${state.wifi_rssi} dBm`;
}

colorPicker.addEventListener("input", () => updatePreview(...Object.values(hexToRGB(colorPicker.value))));
$("applyColor").addEventListener("click", () => {
  const {r,g,b} = hexToRGB(colorPicker.value);
  publish({action:"color",r,g,b}, "Colour sent");
});
document.querySelectorAll(".swatch").forEach(btn => btn.addEventListener("click", () => {
  if (btn.dataset.off === "true") { publish({action:"off"}, "LED switched off"); selectEffect("OFF"); return; }
  const [r,g,b] = btn.dataset.color.split(",").map(Number);
  updateColorPicker(r,g,b);
  publish({action:"color",r,g,b}, "Colour sent");
}));
document.querySelectorAll("[data-effect]").forEach(btn => btn.addEventListener("click", () => {
  const effect = btn.dataset.effect;
  publish({action:"effect", value:effect}, `${effect} selected`);
  selectEffect(effect);
}));
$("brightness").addEventListener("input", e => $("brightnessValue").textContent = `${e.target.value}%`);
$("speed").addEventListener("input", e => $("speedValue").textContent = `${e.target.value}%`);
$("applyBrightness").addEventListener("click", () => publish({action:"brightness",value:Number($("brightness").value)}, "Brightness updated"));
$("applySpeed").addEventListener("click", () => publish({action:"speed",value:Number($("speed").value)}, "Speed updated"));

updateColorPicker(lastRGB.r,lastRGB.g,lastRGB.b);
setConnection(false);
