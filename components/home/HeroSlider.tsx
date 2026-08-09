import Image from "next/image";
import HeroCarousel from "@/components/home/HeroCarousel";
import heroCpns from "@/public/images/hero/hero-cpns-01.webp";
import heroEnglish from "@/public/images/hero/hero-english-01.webp";
import heroIt from "@/public/images/hero/hero-it-01.webp";

const slides = [
  {
    badge: "CPNS",
    title: "Jelajahi Kursus dan Tryout CPNS Terbaik",
    image: heroCpns,
  },
  {
    badge: "Bahasa Inggris",
    title: "Tingkatkan Kemampuan Bahasa Inggris Anda",
    image: heroEnglish,
  },
  {
    badge: "TI & Perangkat Lunak",
    title: "Bangun Keterampilan Teknologi untuk Masa Depan",
    image: heroIt,
  },
] as const;

export default function HeroSlider() {
  return (
    <HeroCarousel labels={slides.map((slide) => slide.badge)}>
      {slides.map((slide, index) => {
        const Heading = index === 0 ? "h1" : "h2";

        return (
          <article
            key={slide.badge}
            data-hero-slide={index}
            className="hero-slide relative aspect-[7/4] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_12px_32px_rgba(16,24,40,0.06)]"
          >
            <Heading className="sr-only">{slide.title}</Heading>
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              fetchPriority={index === 0 ? "high" : "auto"}
              loading={index === 0 ? "eager" : "lazy"}
              quality={72}
              className="object-contain"
              sizes="(min-width: 1024px) 540px, (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2rem)"
            />
          </article>
        );
      })}
    </HeroCarousel>
  );
}
