document.addEventListener('DOMContentLoaded', () => {
  const images = ['1.png', '2.png', '3.png', '4.png', '5.png'];
  const randomIndex = Math.floor(Math.random() * images.length);
  const imgElement = document.getElementById('random-img');
  imgElement.src = 'img/' + images[randomIndex];
});