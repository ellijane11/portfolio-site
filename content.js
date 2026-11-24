/* EVERYTHING YOU NEED TO EDIT IS IN THIS FILE.
   Art:   put pictures in the art folder, then use  src: "art/my-painting.png"
   Music: put songs in the music folder, then use   src: "music/my-song.mp3"
   Set sample to false once the details are yours, and the sample notes disappear. */
window.CONTENT = {
  sample: true,

  card: {
    name: "Your Name",
    role: "Artist and illustrator",
    photo: "",                          // e.g. "art/me.jpg" (empty shows the silhouette)
    number: "0001",
    facts: [
      ["Based in", "A small desk by a big window"],
      ["Makes", "Pixel art, comics, short loops"],
      ["Tools", "Aseprite, Procreate, pencil"],
      ["Open to", "Commissions and collaborations"]
    ],
    about: "I draw quiet places: shops after closing, machines left running, gardens that took the building back. This card has the short version. The journal has the rest.",
    likes: ["Night walks", "Old handhelds", "Ferns", "Vending machine coffee"]
  },

  // Leave src empty to keep a sample drawing (there are six).
  journal: [
    { title: "Low tide moon",   when: "2026", medium: "Pixel, 96 by 72", src: "", note: "Started as a test of three blues. The reflection took longer than everything else put together." },
    { title: "Last train home", when: "2026", medium: "Pixel, 96 by 72", src: "", note: "The seat across the aisle was empty, so I drew the window instead." },
    { title: "Still selling",   when: "2025", medium: "Pixel, 96 by 72", src: "", note: "Nobody has refilled it in years and the light still comes on at six." },
    { title: "Sky whale",       when: "2025", medium: "Pixel, 96 by 72", src: "", note: "From a dream. It was much bigger than this and did not make a sound." },
    { title: "Under the caps",  when: "2025", medium: "Pixel, 96 by 72", src: "", note: "Forest floor study. The glow is two colours, laid in dots." },
    { title: "Window, 4 pm",    when: "2024", medium: "Pixel, 96 by 72", src: "", note: "The light lasts about eleven minutes. I drew it over a week." }
  ],

  // Leave src empty to keep a built-in sample tune (there are three).
  music: [
    { title: "Rust Season",  artist: "Sample tune", src: "" },
    { title: "Closing Time", artist: "Sample tune", src: "" },
    { title: "Vine Line",    artist: "Sample tune", src: "" }
  ],

  // Add a url and the key starts working. Email looks like "mailto:you@example.com".
  keys: [
    { label: "Email",     hint: "Write to me",         url: "" },
    { label: "Instagram", hint: "New drawings",        url: "" },
    { label: "Shop",      hint: "Prints and stickers", url: "" }
  ]
};
