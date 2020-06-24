'use strict'

console.log('Hi Leah');

// $('.movie').on('click', () => {
//   console.log('I am clicked');
//   $('.modal').attr('display', 'block');
// });

$('.modal').hide();
$('.movie').on('click', () => {
  $('.modal').show();
})


// hamburger menu`
$(document).ready(function(){
  $('#burger-container').on('click', function(){
    console.log('I am clicked');
    $(this).toggleClass('open');
  });
});
