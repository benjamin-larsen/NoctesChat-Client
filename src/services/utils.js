export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getInitals(username) {
  let parts = username.split(/\s/)

  if (parts.length > 2) {
    parts = [parts[0], parts[parts.length - 1]]
  }

  return parts.map(x => x[0].toUpperCase()).join("")
}