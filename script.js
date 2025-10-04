const searchbar = document.querySelector('#searchbar');
const searchButton = document.querySelector('#button');
const displayBox = document.querySelector('#output');

searchButton.addEventListener("click", display)

function display () {
    displayBox.innerHTML = "<img id=\"pokemon\" src=\"https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/025.png\">"
}


let element = document.createElement("a")
element.textContent = "Fortnite Battle Pass"
let title = document.querySelector("#title")

title.appendChild(element)
title.addE
