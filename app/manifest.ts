import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Play Square",
    short_name: "PlaySquare",
    description: "Football team management app for Algerian youth",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#FF3B3F",
    icons: [
      {
        src: "/icon-192.jpg",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.jpg",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
