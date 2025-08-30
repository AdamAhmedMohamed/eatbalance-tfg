import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../hooks/useAuth'; // 👈

const Navbar = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const profileRef = useRef(null); // 👈 perfil

  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  // Datos del usuario
  const displayName = (user?.full_name?.trim() || user?.email || 'Usuario');
  const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  // Perfil abierto/cerrado
  const [isProfileOpen, setProfileOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    document.querySelector('.overlay')?.classList.toggle('active', !isMenuOpen);
  };

  const handleOutsideClick = (event) => {
    if (isMenuOpen && !event.target.closest('.navbar') && !event.target.closest('.hamburger-menu')) {
      setMenuOpen(false);
    }
    if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
    // 👇 cerrar menú de perfil si clic fuera
    if (isProfileOpen && profileRef.current && !profileRef.current.contains(event.target)) {
      setProfileOpen(false);
    }
  };

  const handleScroll = () => setIsScrolled(window.scrollY > 0);

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMenuOpen, isDropdownOpen, isProfileOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/">
            <img src="/eatbalance_esquina.png" alt="Logo" />
          </Link>
        </div>

        {/* Icono de menú hamburguesa */}
        <div
          className={`hamburger-menu ${isMenuOpen && !isScrolled ? 'open' : ''}`}
          onClick={toggleMenu}
        >
          {isMenuOpen ? '✖' : '☰'}
        </div>

        <ul className={`navbar-links ${isMenuOpen ? 'responsive responsive-menu' : ''}`}>
          <li>
            <NavLink exact to="/" activeClassName="active" style={{ color: 'white' }}>
              Página Principal
            </NavLink>
          </li>

          <li className={`dropdown ${isDropdownOpen ? 'open' : ''}`} ref={dropdownRef}>
            <button onClick={toggleDropdown} className="dropdown-btn">
              Dieta <span className="arrow">ᐁ</span>
            </button>
            {isDropdownOpen && (
              <ul className="dropdown-menu">
                <li className="dropdown-separator">
                  <NavLink to="/resumen" activeClassName="active" style={{ color: 'white' }}>
                    <strong>Todas las herramientas</strong>
                  </NavLink>
                  <hr />
                </li>
                <li>
                  <NavLink to="/curso" activeClassName="active" style={{ color: 'white' }}>
                    Calcula tu plan de dieta
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/bdd-automatizacion" activeClassName="active" style={{ color: 'white' }}>
                    Genera tus menús
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          <li>
            <NavLink to="/Partnership" activeClassName="active" style={{ color: 'white' }}>
              Alimentos
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" activeClassName="active" style={{ color: 'white' }}>
              Asesoría Nutricional
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" activeClassName="active" style={{ color: 'white' }}>
              Contacto
            </NavLink>
          </li>

          {/* ───── Perfil elegante (nombre + fecha, desplegable con "Cerrar sesión") ───── */}
          <li className="nav-session profile" style={{ marginLeft: 'auto' }} ref={profileRef}>
            {token ? (
              <>
                <button
                  type="button"
                  className={`user-chip ${isProfileOpen ? 'open' : ''}`}
                  onClick={() => setProfileOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                >
                  <span className="u-name">{displayName}</span>
                  <span className="u-date">{hoy}</span>
                  <span className="u-chev">ᐁ</span>
                </button>

                {isProfileOpen && (
                  <ul className="profile-menu" role="menu">
                    <li role="menuitem">
                      <button
                        type="button"
                        className="profile-action"
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                          setMenuOpen(false);
                          document.querySelector('.overlay')?.classList.remove('active');
                          navigate('/welcome', { replace: true });
                        }}
                      >
                        Cerrar sesión
                      </button>
                    </li>
                  </ul>
                )}
              </>
            ) : (
              <NavLink
                to="/welcome?mode=login"
                className="btn-in"
                style={{
                  color: '#fff',
                  border: '1px solid #fff',
                  padding: '6px 10px',
                  borderRadius: 8
                }}
                onClick={() => setMenuOpen(false)}
              >
                Iniciar sesión
              </NavLink>
            )}
          </li>
        </ul>
      </nav>

      {/* Overlay para cerrar el menú móvil */}
      {isMenuOpen && <div className="overlay" onClick={toggleMenu}></div>}
    </>
  );
};

export default Navbar;
