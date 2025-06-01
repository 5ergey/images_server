document.addEventListener('DOMContentLoaded', () => {
  const images = ['1.png', '2.png', '3.png', '4.png', '5.png'];
  const randomIndex = Math.floor(Math.random() * images.length);

  const img = document.createElement('img');
  img.src = 'img/' + images[randomIndex];
  img.alt = 'img';
  img.className = 'random-img';

  const wrapper = document.querySelector('.img__wrapper');
  wrapper.appendChild(img);
});
