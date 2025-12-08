export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getInitals(username, useLast = true) {
  let parts = username.split(/[^\w]+/).filter(u => u);

  if (parts.length > 2) {
    parts = [parts[0], parts[useLast ? parts.length - 1 : 1]]
  }

  return parts.map(x => x[0].toUpperCase()).join("")
}