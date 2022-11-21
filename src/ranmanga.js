import fetch from "node-fetch";
const baseUrl = "https://api.jikan.moe/v4/random/manga";


export async function loadPictures(mangaId) {
    const imagesUrl = "https://api.jikan.moe/v4/manga/" + mangaId + "/pictures";

    let getPictures = fetch(imagesUrl)
        .then(response => response.json(), { mode: 'no-cors' })
        .then(data => {
            return data.data;
        })
        .catch(error => console.log(error));
    
    const result = await getPictures;
    return result;
}

export async function getFullMangaData(mangaId) {
    const mangaUrl = "https://api.jikan.moe/v4/manga/" + mangaId + "/full";
    let getManga = fetch(mangaUrl)
        .then(response => response.json(), { mode: 'no-cors' })
        .then(data => {
            return data.data;
        })
        .catch(error => console.log(error));
    
    const fullMangaresult = await getManga;
    return fullMangaresult;
}

