var signInButton = document.querySelector('.start-now');
var heroSection = document.querySelector('.hero');
let isHeroInView = true;
let heroImage;

document.addEventListener("DOMContentLoaded", () => {
    heroImage =  document.getElementById("hero_image");
    
    initIntoViewAnim();
    initWindowScrollListener();
    iterateHeroImages();
    moveHeroImage();
});

window.onresize = moveHeroImage;

function initWindowScrollListener() {
    window.addEventListener('scroll', function() {
        var heroRect = heroSection.getBoundingClientRect();
        
        if (heroRect.bottom < 0) {
            signInButton.style.display = 'block';
            signInButton.style.right = '20px';
        } else {
            signInButton.style.right = '-200px';
        }
    });
}

function initIntoViewAnim() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                if (entry.target == heroImage) {
                    isHeroInView = true;
                }
                entry.target.classList.add("in-view-fade-in");
            } else {
                if (entry.target == heroImage) {
                    isHeroInView = false;
                }
                entry.target.classList.remove("in-view-fade-in");
            }
        });
    });
    
    observer.observe(heroImage);
    
    document.querySelectorAll(".content-fade-in").forEach((content) => {
        observer.observe(content);
    });
}


function redirectToSignIn() {
    window.location.href = 'signin';
}

function moveHeroImage() {
    const heroImageDiv = document.getElementById('hero_image_container');
    const smallScreenContainer = document.getElementById('mobile_hero');
    const heroImageContainer = document.getElementById('desktop_hero');

    if (window.innerWidth <= 768) { // Bootstrap's breakpoint for small screens
        smallScreenContainer.appendChild(heroImageDiv);
    } else {
        heroImageContainer.appendChild(heroImageDiv);
    }
}

function iterateHeroImages() {
    let count = 0; // Start count at 0 to match array indexing

    const newImageSources = [
        'assets/images/landing/hero/tracking1.png',
        'assets/images/landing/hero/tracking2.png',
        'assets/images/landing/hero/tracking3.png',
        'assets/images/landing/hero/tracking4.png'
    ];
    setInterval(function () {
        if (isHeroInView) {
           heroImage.classList.add('fade-out');
                
            setTimeout(function () {
                heroImage.src = newImageSources[count];
                heroImage.classList.remove('fade-out');
            }, 1300);
            
            count++;
            if (count == 4) {
                count = 0;
            }
        }
    }, 2000); // Interval between image changes
}