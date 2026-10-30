const menuBreakpoint = window.matchMedia("(max-width: 768px)");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const closeButton = document.querySelector(".menu-close");
const menuOverlay = document.querySelector(".menu-overlay");

if (menuButton && navigation && closeButton && menuOverlay) {
  let menuIsOpen = false;

  function closeMenu(restoreFocus = false) {
    menuIsOpen = false;
    navigation.classList.remove("is-open");
    menuOverlay.classList.remove("is-visible");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
    navigation.inert = menuBreakpoint.matches;
    document.body.classList.remove("navigation-open");

    if (restoreFocus && menuBreakpoint.matches) {
      menuButton.focus();
    }
  }

  function openMenu() {
    if (!menuBreakpoint.matches) {
      return;
    }

    menuIsOpen = true;
    navigation.inert = false;
    navigation.classList.add("is-open");
    menuOverlay.classList.add("is-visible");
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close navigation menu");
    document.body.classList.add("navigation-open");
    closeButton.focus();
  }

  menuButton.addEventListener("click", () => {
    if (menuIsOpen) {
      closeMenu(true);
    } else {
      openMenu();
    }
  });

  closeButton.addEventListener("click", () => closeMenu(true));
  menuOverlay.addEventListener("click", () => closeMenu(true));

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!menuIsOpen) {
      return;
    }

    if (event.key === "Escape") {
      closeMenu(true);
      return;
    }

    if (event.key === "Tab") {
      const focusableItems = [
        closeButton,
        ...navigation.querySelectorAll("a[href]"),
      ];
      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }
  });

  menuBreakpoint.addEventListener("change", (event) => {
    closeMenu();
    navigation.inert = event.matches;
  });

  navigation.inert = menuBreakpoint.matches;
}
