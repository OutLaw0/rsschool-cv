/*test burger button*/

const burgerButton = document.querySelector(".hamburger");
const burgerButtonLine = document.querySelector(".line");
const nav = document.querySelector(".nav");
const siteNav = document.querySelector(".nav-list");

function openNav() {
    burgerButton.classList.toggle("is-active");
    nav.classList.toggle("is-active");

}

function closeNav(event) {
     const target = event.target;
    const its_menu = target == siteNav;
    const its_btnMenu = target == burgerButton || burgerButton.contains(target);
    const menu_is_active = nav.classList.contains("is-active");
   
 if (menu_is_active && !its_btnMenu && !its_menu){ //Close menu onclick all elem except nav_list
    burgerButton.classList.remove("is-active");
    nav.classList.remove("is-active");
   }

  
}

burgerButton.addEventListener("click", openNav); //set the event
burgerButton.addEventListener("touchmove", openNav, {passive:false}); //set the event
document.addEventListener("click", closeNav); //set the event
document.addEventListener("touchend", closeNav, {passive:false}); //set the event

/*test burger button*/

/*To Top*/
const scrollToTopBtn = document.querySelector(".button-to-top");

function getScrollPage() {
  

    if (document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
   
    scrollToTopBtn.style.opacity = '1';  }
    else {
   
    scrollToTopBtn.style.opacity = '0';  }
};

function scrollToTop() {
  const distFromTop = document.documentElement.scrollTop || document.body.scrollTop;

  if (distFromTop > 0) {
   
    window.scrollTo(0, 0);
  }
};

document.addEventListener("scroll", getScrollPage);
scrollToTopBtn.addEventListener("click", function(e) {
 // e.preventDefault();
  scrollToTop();
});

/*To Top*/