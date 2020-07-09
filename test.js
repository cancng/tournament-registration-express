const deneme = [
  {
    name: 'ahmet',
    id: 123,
  },
  {
    name: 'mehmet',
    id: 124,
  },
  {
    name: 'mahmut can',
    id: 124,
  },
  {
    name: 'deniz barış',
    id: 126,
  },
];

const filterer = deneme.filter((item) => {
  return item.id === 124 && item.name === 'mehmetx';
});

console.log(filterer.length);
