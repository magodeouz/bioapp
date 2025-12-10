// Navigation helper - highlights active page in sidebar
export function highlightActivePage() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('aside nav a');
  
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Normalize paths for comparison
    const normalizedHref = href.replace(/^\//, '').replace(/\.html$/, '').replace(/\/index$/, '');
    const normalizedPath = currentPath.replace(/^\//, '').replace(/\.html$/, '').replace(/\/index$/, '');
    
    // Check if current path matches this link
    const isActive = normalizedPath === normalizedHref || 
                     (normalizedHref === 'dashboard' && normalizedPath === 'dashboard') ||
                     (normalizedHref === 'links' && normalizedPath.startsWith('links')) ||
                     (normalizedHref === 'themes/manage' && normalizedPath === 'themes/manage') ||
                     (normalizedHref === 'settings' && normalizedPath === 'settings');
    
    if (isActive) {
      // Remove existing styles
      link.classList.remove('text-copy-light-secondary', 'dark:text-copy-dark-secondary', 'hover:text-copy-light', 'dark:hover:text-copy-dark', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
      // Add active styles
      link.classList.add('bg-indigo-100', 'dark:bg-indigo-500/20', 'text-primary', 'dark:text-indigo-300');
      // Make icon filled
      const icon = link.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.fontVariationSettings = "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24";
      }
    } else {
      // Ensure non-active links have correct styles
      link.classList.remove('bg-indigo-100', 'dark:bg-indigo-500/20', 'text-primary', 'dark:text-indigo-300');
      link.classList.add('text-copy-light-secondary', 'dark:text-copy-dark-secondary', 'hover:text-copy-light', 'dark:hover:text-copy-dark', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
      // Make icon unfilled (only if not already set to filled in HTML)
      const icon = link.querySelector('.material-symbols-outlined');
      if (icon) {
        const existingStyle = icon.getAttribute('style') || '';
        if (!existingStyle.includes("'FILL' 1")) {
          icon.style.fontVariationSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', highlightActivePage);

