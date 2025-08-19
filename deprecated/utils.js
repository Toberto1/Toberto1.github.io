function allowOnlyNumbers(inputElement) {
  inputElement.addEventListener('input', () => {
    inputElement.value = inputElement.value.replace(/\D/g, '');
  });
}


allowOnlyNumbers(document.getElementById('addAddedDays'));