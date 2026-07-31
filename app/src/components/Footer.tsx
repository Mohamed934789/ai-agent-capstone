const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-4 text-center animate-fade-up" style={{ animationDelay: "0.4s" }}>
      <p className="text-xs font-mono text-muted">
        designed & built by{" "}
        <span className="text-foreground">Mohamed Kassab</span>
        <span className="mx-2 text-border">·</span>
        <a href="#" target="_blank" className="hover:text-signal transition-colors">
          GitHub
        </a>
      </p>
    </footer>
  );
};

export default Footer;