const PORT = 3000;


async function getAccount(id) {
  try {
    const res = await fetch('http://localhost:3000/api/getAccount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: id })
    });

    const data = await res.json();
    return data;

  } catch (err) {
    console.error('Error:', err);
    return null;
  }
}






console.log(getAccount(1));


async function searchAccountByName(name) {
  try {
    const res = await fetch('http://localhost:3000/api/searchByName', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({name: name.trim()})
    });

    const data = await res.json();
    return data;

  } catch (err) {
    console.error('Error:', err);
    return null;
  }
}

console.log(searchAccountByName("john"));