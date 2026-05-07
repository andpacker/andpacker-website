import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import TourDates from "@/components/TourDates";
import Specials from "@/components/Specials";
import EmailSignup from "@/components/EmailSignup";
import SocialLinks from "@/components/SocialLinks";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TourDates />
        <Specials />
        <EmailSignup />
        <SocialLinks />
      </main>
      <Footer />
    </>
  );
}
