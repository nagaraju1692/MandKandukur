import fetch from "node-fetch";

const API_KEY = "sk-or-v1-yourkey";
const url = "https://openrouter.ai/api/beta/batches";

const payload = {
  model: "google/gemini-3.7-flash:batch",
  input: [{ role: "user", content: "Generate a list of creative app ideas." }]
};

const headers = { Authorization: `Bearer ${API_KEY}` };

fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
