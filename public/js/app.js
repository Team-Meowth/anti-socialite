'use strict'

console.log('Hi Leah');

// $('.movie').on('click', () => {
//   console.log('I am clicked');
//   $('.modal').attr('display', 'block');
// });

$('.modal').hide();
$('.movie').on('click', (event) => {
  let clicked = event.target.id;
  console.log(clicked)
  $(`#${clicked}Modal`).show();
  // $('main').not('.modal').css('filter','blur(1px)')
})

$('.close').on('click', (event) => {
  $('.modal').hide();
})
