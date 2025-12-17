function generate_date_seq(date = null) {
  if (date === null) {
    date = new Date();
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(2);
  const weekday = String(date.getDay());
  return day[0] + month[0] + year[0] + weekday + day[1] + month[1] + year[1];
}

function base64Encode(data) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(data)));
}

const IV = new TextEncoder().encode("dcek9wb8frty1pnm");

async function generate_key(date = null) {
  const dateSeq = generate_date_seq(date);
  const keyData = new TextEncoder().encode("qa8y" + dateSeq + "ty1pn");
  return window.crypto.subtle.importKey("raw", keyData, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]);
}

async function encrypt(data) {
  const key = await generate_key();
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-CBC", iv: IV }, key, data);
  return new Uint8Array(encrypted);
}

export async function serialize_payload(payload) {
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  const pbytes = await encrypt(raw);
  return base64Encode(pbytes);
}
