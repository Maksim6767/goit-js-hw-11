import fetchImages from './fetch-images'; // Импорт фукцции запроса данных на бэкенд
import cardTemplate from '../templates/card-template.hbs'; // Импорт разметки карточки изображений
import { Notify } from 'notiflix/build/notiflix-notify-aio'; // Импорт библиотеки уведомлений notiflix
import SimpleLightbox from 'simplelightbox'; // Импорт библиотеки SimpleLightbox для увеличения изображений для галерей 
// Для того чтобы подключить CSS код библиотеки SimpleLightbox в проект, 
// необходимо добавить еще один импорт, кроме того который описан в документации
import 'simplelightbox/dist/simple-lightbox.min.css';
import throttle from 'lodash.throttle';

const { searchForm, gallery, loadMoreBtn, endCollectionText } = {
  searchForm: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  loadMoreBtn: document.querySelector('.load-more'),
  endCollectionText: document.querySelector('.end-collection-text'),
};

// Рендер разметки карточек изображений 
function renderCardImage(arr) {
    const markup = arr.map(item => cardTemplate(item)).join('');
    gallery.insertAdjacentHTML('beforeend', markup);
}
// Создаем экземпляр библиотеки со свойствами
let lightbox = new SimpleLightbox('.photo-card a', {
  captions: true,
  captionsData: 'alt',
  captionDelay: 250,
});

let currentPage = 1;  // Начальное значение параметра page должно быть равным 1
let currentHits = 0;  // Начальное количество обращений
let searchQuery = ''; // Начальное значение инпута

searchForm.addEventListener('submit', onSubmitSearchForm);

async function onSubmitSearchForm(e) {
    e.preventDefault();
    searchQuery = e.currentTarget.searchQuery.value;
    currentPage = 1;

    if (searchQuery === '') {
        return;
    }

    const response = await fetchImages(searchQuery, currentPage); // Делаем запрос данных
    currentHits = response.hits.length; //Подсчет количества изображений
    
//totalHits-общее количество изображений которые подошли под критерий поиска для бесплатного аккаунта
    if (response.totalHits > 40) {
        loadMoreBtn.classList.remove('is-hidden'); // показать кнопку
    } else {
        loadMoreBtn.classList.add('is-hidden');    // скрыть кнопку
}

        try {
            if (response.totalHits > 0) {
// Вывод уведомления после первого запроса при каждом новом поиске в котором пишется сколько всего нашли изображений
                Notify.success(`Hooray! We found ${response.totalHits} images.`);
// При поиске по новому ключевому слову необходимо полностью очищать содержимое галереи,
// чтобы не смешивать результаты
                gallery.innerHTML = '';
                renderCardImage(response.hits);
// Уничтожает и повторно инициализирует лайтбокс каждый раз после добавления новой группы карточек изображений
                lightbox.refresh();
                endCollectionText.classList.add('is-hidden');
                // Плавный скролл страницы
                const { height: cardHeight } = document // cardHeight - высота карты
                    .querySelector('.gallery')
// Метод Element.getBoundingClientRect()возвращает DOMRectобъект, предоставляющий информацию о размере 
// элемента и его положении относительно области просмотра
                    .firstElementChild.getBoundingClientRect();
// window.scrollBy - прокручивает документ на указанные величины
                window.scrollBy({
                    top: cardHeight * 2, // Прокрутка страницы на две высоты карты 
                    behavior: 'smooth',  // Элемент прокручивается плавно;
                });
            }
// Если пользователь дошел до конца коллекции, прячем кнопку и выводим уведомление с текстом 
            if (response.totalHits === 0) {
                gallery.innerHTML = '';
                Notify.failure('Sorry, there are no images matching your search query. Please try again.');
                loadMoreBtn.classList.add('is-hidden');
                endCollectionText.classList.add('is-hidden');
            }
        } catch (error) {
            console.log(error);
        }
    }

    loadMoreBtn.addEventListener('click', onClickLoadMoreBtn);

    async function onClickLoadMoreBtn() {
        //Увеличение параметра page на 1 при каждом последующем запросе
        currentPage += 1;
        const response = await fetchImages(searchQuery, currentPage);
        renderCardImage(response.hits);
        lightbox.refresh();
        currentHits += response.hits.length;

        if (currentHits === response.totalHits) {
            loadMoreBtn.classList.add('is-hidden');
            endCollectionText.classList.remove('is-hidden');
        }
    }

