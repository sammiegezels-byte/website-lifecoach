const lucide = require('lucide-react');
console.log("Exports:");
for (const key of Object.keys(lucide)) {
  if (key.toLowerCase().includes('face') || key.toLowerCase().includes('insta') || key.toLowerCase().includes('link')) {
    console.log(key);
  }
}
