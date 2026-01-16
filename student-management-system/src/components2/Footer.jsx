import React from 'react';
import '../styles/footer.css'; 

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} NJ Extra Classes. All rights reserved.</p>
        <p className="footer-link">Designed with ❤️ by Motsie</p>
      </div>
    </footer>
  );
};

export default Footer;
