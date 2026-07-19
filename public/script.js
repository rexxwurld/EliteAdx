document.addEventListener("DOMContentLoaded", function () {
  // ===== MOBILE MENU LOGIC =====
  const menuIcon = document.getElementById("menuIcon");
  const navLinks = document.getElementById("navLinks");
  const navItems = navLinks.querySelectorAll("a");

  menuIcon.addEventListener("click", function (e) {
    e.stopPropagation();
    menuIcon.classList.toggle("active");
    navLinks.classList.toggle("active");
  });

  navItems.forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("active");
      menuIcon.classList.remove("active");
    });
  });

  document.addEventListener("click", function (e) {
    if (
      navLinks.classList.contains("active") &&
      !e.target.closest("#navLinks, #menuIcon")
    ) {
      navLinks.classList.remove("active");
      menuIcon.classList.remove("active");
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      navLinks.classList.remove("active");
      menuIcon.classList.remove("active");
    }
  });

  // ===== SMOOTH SCROLL TO #fworm =====
  const fwormLink = document.querySelector("a[href='#fworm']");
  if (fwormLink) {
    fwormLink.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.getElementById("fworm");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // ===== SCROLL REVEAL =====
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll(".reveal").forEach(function (el) {
    observer.observe(el);
  });

  // ===== FORM SUBMISSION =====
  const form = document.getElementById("form");
  if (form) {
    form.addEventListener("submit", function (e) {
      const successMsg = document.getElementById("successMsg");
      if (successMsg) {
        successMsg.style.display = "block";
        setTimeout(function () {
          successMsg.style.display = "none";
        }, 3000);
      }
    });
  }
});