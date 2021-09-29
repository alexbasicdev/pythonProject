const GAME_STATUS_STARTED = 'started';
const GAME_STATUS_PAUSED  = 'paused';
const GAME_STATUS_STOPPED = 'stopped';

const SNAKE_DIRECTION_UP = 'up';
const SNAKE_DIRECTION_DOWN = 'down';
const SNAKE_DIRECTION_LEFT = 'left';
const SNAKE_DIRECTION_RIGHT = 'right';

const SNAKE = 'snake';
const FOOD = 'food';

//Имена тайлов
const TILE_PATH = "img/tiles/";//местонахождение тайлов
const TILE_EXT = ".png";
const TILE_FOOD = "food";
const TILE_GROUND = "ground";
//snake
const TILE_HEAD = "head";
const TILE_TAIL = "tail";
const TILE_BODY = "body";
const TILE_LEFT = "_l";
const TILE_RIGHT = "_r";
const TILE_UP = "_u";
const TILE_DOWN = "_d";

const SPEED = 100;//Скорость змейки (интервал в милисекундах между шагами)
const FOOD_MAX = 3;//Максимум еды на поле

/**
 * Объект с настройками конфигурации игры
 */
const config = {
    /**
     * Размер поля.
     */
    size: 16
};

/**
 * Основной объект игры.
 */
const game = {

    /**
     * Cсылка на событие по таймеру
     */
    timeEvent: {},

    /**
     * Функция ищет HTML элемент контейнера игры на странице.
     *
     * @returns {HTMLElement} Возвращает HTML элемент.
     */
    getElement() {
        return document.getElementById('game');
    },

    /**
     * Инициализация игры при первом старте и полсе Game Over
     */
    reset() {
        this.setGameStatus(GAME_STATUS_STOPPED);
        snake.reset();
        food.reset();
        score.resetScore();
    },

    /**
     * Функция выполняет старт игры.
     */
    start() {

        //если игра остановлена то делаем инициализацию
        if (this.checkGameStatus(GAME_STATUS_STOPPED)) {
            this.reset();
            board.render();
            snake.render();
            food.render();
        }

        //сработает только если игра уже итак не запущена
        if (!this.checkGameStatus(GAME_STATUS_STARTED)) {
            this.setGameStatus(GAME_STATUS_STARTED);
            this.timeEvent = window.setInterval(game.move.bind(game), SPEED);
        }

    },

    /**
     * Функция выполняет паузу игры.
     */
    pause() {
        //сработает только если идет игра
        if (this.checkGameStatus(GAME_STATUS_STARTED)) {
            this.setGameStatus(GAME_STATUS_PAUSED);

            window.clearInterval(this.timeEvent);
        }
    },

    /**
     * Функция останавливает игру.
     */
    stop() {
        //не сработает если игра уже итак остановлена
        if (!this.checkGameStatus(GAME_STATUS_STOPPED)) {
            this.setGameStatus(GAME_STATUS_STOPPED);
            alert("GAME OVER");
    
            window.clearInterval(this.timeEvent);
    
        }
    },

    /**
     * Функция обработчик клавиатуры
     *
     * @param event {KeyboardEvent} Событие нажатия на клавишу.
     */
     keysHandler(event) {
        let direction = null;

        /* смотрим на код клавишы и
         * устанавливаем соответсвующее направление движения */
        switch (event.keyCode) {
            case 38:
                direction = SNAKE_DIRECTION_UP;
                break;
            case 40:
                direction = SNAKE_DIRECTION_DOWN;
                break;
            case 37:
                direction = SNAKE_DIRECTION_LEFT;
                break;
            case 39:
                direction = SNAKE_DIRECTION_RIGHT;
                break;
            default:
                return;
        }

        /* устанавливаем позицию для змейки
         * и запрашиваем координаты следующей позиции */
        snake.setDirection(direction);

        //this.move();
    },

    /**
     * Функция выполняет передвижение змейки по полю.
     */
    move() {
        const nextPosition = snake.getNextPosition();

        //Проверка на пересечение с телом змеи
        const status = cells.getCellStatus(nextPosition);
        if (status == SNAKE) {
            game.stop();
            return;
        }

        /* проверяем совпадает ли следующая позиция с какой-нибудь едой */
        const foundFood = food.foundPosition(nextPosition);

        /* если найден индекс еды (то есть позиция совпадает) */
        if (foundFood !== -1) {
            /* устанавливаем следующую позицию змейки с вторым параметром "не удалять хвост змейки",
             * змейка съев еду вырастает на одну клетку */
            snake.setPosition(nextPosition, false);

            /* удаляем еду с поля */
            food.removeItem(foundFood);

            /* Увеличиваем счет на 1 */
            score.changeScore(1);

            /* генерируем новую еду на поле */
            food.generateItem();

            /* перерендериваем еду */
            food.render();
        } else {
            /* если индекс не найден, то просто устанавливаем новую координату для змейки */
            snake.setPosition(nextPosition);
        }

        /* перерендериваем змейку */
        snake.render();
    },

    /**
     * Функция устанавливает текущий статус игры,
     * раскрашивая контейнер игры в нужный цвет.
     *
     * @param status {GAME_STATUS_STARTED | GAME_STATUS_PAUSED | GAME_STATUS_STOPPED} Строка представляющая статус.
     */
    setGameStatus(status) {
        const element = game.getElement();

        // обратить внимание, как сделать красивее
        element.classList.remove(GAME_STATUS_STARTED, GAME_STATUS_PAUSED, GAME_STATUS_STOPPED);
        element.classList.add(status);
    },

    /**
     * Проверяет установлен ли соответствующий статус у игры
     * 
     * @param status {GAME_STATUS_STARTED | GAME_STATUS_PAUSED | GAME_STATUS_STOPPED} Строка представляющая статус.
     * @returns true если статус установлен
     * 
     * Технически тут стоило бы сделать возврат конкретного статуса,
     * и проверять его уже на месте, чтобы можно было построить 
     * норальную стейт-машину, но пока пусть остается так.
     */
    checkGameStatus(status) {
        let isStatusSet = false;
        const element = game.getElement();
        for (const item of element.classList) {
            if (item == status) { isStatusSet = true };
        }

        return isStatusSet;
    }

};

/**
 * Объект подсчитывающий очки в игре
 */
const score = {

    /**
    * Функция ищет HTML элемент поля на странице.
    *
    * @returns {HTMLElement} Возвращает HTML элемент.
    */
    getElement() {
        return document.getElementById('score');
    },

    /**
    * Функция ищет HTML элемент поля на странице.
    *
    * @returns {HTMLElement} Возвращает HTML элемент.
    */
    getCurrentScore() {
        return document.getElementById('score-value');
    },
    
    /**
    * Функция ищет HTML элемент поля на странице.
    *
    * @returns {HTMLElement} Возвращает HTML элемент.
    */
    getHighScore() {
        return document.getElementById('highscore-value');
    },
    
    /**
    * Функция обнуляет текущий счет 
    */
    resetScore() {
        const currentScore = this.getCurrentScore();
        currentScore.innerHTML = "0";
    },

    /**
    * Функция обнуляет текущий счет
    */
    changeScore(value) {
        const currentScore = this.getCurrentScore();
        const highScore = this.getHighScore();
        let currentScoreValue = Number.parseInt(currentScore.innerHTML) + value
        currentScore.innerHTML = currentScoreValue;
        if (Number.parseInt(highScore.innerHTML) < currentScoreValue) {
            highScore.innerHTML = currentScoreValue;
        }

    },

    
}

/**
 * Объект, представляющий поле, где ползает змейка.
 */
const board = {

    // cells: [
    //     { top: 0, left: 0, className: '' }
    // ],

    /**
     * Функция ищет HTML элемент поля на странице.
     *
     * @returns {HTMLElement} Возвращает HTML элемент.
     */
    getElement() {
        return document.getElementById('board');
    },

    /**
     * Функция отрисовывает поле с клетками для игры.
     */
    render() {
        const boardObj = this.getElement();
        clearItem(boardObj);

        /* рисуем на странице клетки */
        for (let i = 0; i < config.size**2; i++) {
            const cell = document.createElement('span');
            cell.classList.add('cell');

            const img = document.createElement('img');
            img.src = TILE_PATH + TILE_GROUND + TILE_EXT;
            cell.appendChild(img);

            /* высчитываем и записываем в data атрибуты
             * координаты от верхней и левой границы */
            cell.dataset.top = Math.trunc(i / config.size);
            cell.dataset.left = i % config.size;

            boardObj.appendChild(cell);
        }
    }
};

/**
 * Объект, представляющий клетку на поле.
 */
const cells = {
    

    /**
     * Функция ищет HTML элементы клеток на странице.
     *
     * @returns { HTMLCollectionOf.<Element>} Возвращает набор HTML элементов.
     */
    getElements() {
        return document.getElementsByClassName('cell');
    },

    /**
     * Проверяет что находится в ячейке
     * 
     * @position {{top: number, left: number}} позиция проверяемой клетки
     * 
     * @returns содержимое ячейки в виде названия класса
     */
    getCellStatus(position) {
        const cells = this.getElements();

        /* для заданных координат ищем клетку и добавляем класс */
        const cell = document.querySelector(`.cell[data-top="${position.top}"][data-left="${position.left}"]`);

        return cell.classList[cell.classList.length - 1];
    },

    /**
     * Функция ищет клетку в документе
     *
     * @param coordinates {top: number, left: number} Координата очищаемой клетки
     */
     findCell(coordinate) {

        return document.querySelector(`.cell[data-top="${coordinate.top}"][data-left="${coordinate.left}"]`);
    },



    /**
     * Функция очищает клетку по заданным координатам
     *
     * @param coordinates {top: number, left: number} Координата очищаемой клетки
     */
    renderClearCell(coordinate) {
        const cells = this.getElements();

        const cell = this.findCell(coordinate);
        clearItem(cell);

        cell.classList.length = 0;
        cell.classList.add("cell");

        const img = document.createElement('img');
        img.src = TILE_PATH + TILE_GROUND + TILE_EXT;;
        cell.appendChild(img);

    },


    /**
     * Функция задает класс для клетки по заданным координатам.
     *
     * @param coordinates {Array.<{top: number, left: number}>} Массив координат клеток для изменения.
     * @param className {string} Название класса.
     */
    renderItems(coordinates, className) {
        const cells = this.getElements();

        /* для всех клеток на странице удаляем переданный класс если не пустой*/
        for (let cell of cells) {
            cell.classList.remove(className);
        }

        switch (className) {
            case "food":
                this.renderFood(coordinates);
                break;
            case "snake":
                this.renderSnake(coordinates);
                break;
            }


        if (className == "snake") { this.renderSnake(coordinates); }

    },

    
    /**
     * Функция отрисовыве змейку на поле с учетом изгибов тела
     *
     * @param coordinates {Array.<{top: number, left: number}>} Массив координат клеток для изменения.
     */
    renderSnake(coordinates) {

        //Хвост
        let cell = this.findCell(coordinates[0]);
        clearItem(cell);

        cell.classList.add("snake");
        let suffix = getSuffix(coordinates[0], coordinates[1]);

        let img = document.createElement('img');
        img.src = TILE_PATH + TILE_TAIL + suffix+ TILE_EXT;;
        cell.appendChild(img);

        //Голова
        cell = this.findCell(coordinates[coordinates.length-1]);
        clearItem(cell);

        cell.classList.add("snake");
        suffix = getSuffix(coordinates[coordinates.length-1], coordinates[coordinates.length-2]);

        img = document.createElement('img');
        img.src = TILE_PATH + TILE_HEAD + suffix+ TILE_EXT;;
        cell.appendChild(img);


        //Тело
        for (let i = 1; i < coordinates.length - 1; i++){
            cell = this.findCell(coordinates[i]);
            clearItem(cell);
            cell.classList.add("snake");

            const suffix1 = getSuffix(coordinates[i], coordinates[i - 1]);
            const suffix2 = getSuffix(coordinates[i], coordinates[i + 1]);

            const img = document.createElement('img');
            img.src = TILE_PATH + TILE_BODY + suffix1 + suffix2 + TILE_EXT;;
            cell.appendChild(img);

        }


        /**
         * Возвращает суффикс для имени файла тайла в зависимости от взаимоположениия клеток
         * 
         * @param {{top: number, left: number}} coordinateFirst 
         * @param {{top: number, left: number}} coordinateSecond 
         * @returns суффикс для имени тайла
         */
        function getSuffix(coordinateFirst, coordinateSecond) {
            let dx = coordinateFirst.left - coordinateSecond.left;
            let dy = coordinateFirst.top - coordinateSecond.top;
            let suffix = "";
            switch(true) {
                case (dx === -1 || dx > 1):
                    suffix = TILE_RIGHT;
                    break;
                case (dx === 1 || dx < -1):
                    suffix = TILE_LEFT;
                    break;
                case (dy === -1 || dy > 1):
                    suffix = TILE_DOWN;
                    break;
                case (dy === 1 || dy < -1):
                    suffix = TILE_UP;
                    break;
                        
            }
            return suffix;

        }
    },

    /**
     * Функция отрисовыве еду на поле
     *
     * @param coordinates {Array.<{top: number, left: number}>} Массив координат клеток для изменения.
     */
    renderFood(coordinates) {

        /* для заданных координат ищем клетку и добавляем класс */
        for (let coordinate of coordinates) {
            const cell = this.findCell(coordinate);
            clearItem(cell);
            cell.classList.add("food");

            const img = document.createElement('img');
            img.src = TILE_PATH + TILE_FOOD + TILE_EXT;;
            cell.appendChild(img);
                        
        }
    
    }
    
    
    
     
};

/**
 * Объект, представляющий змейку.
 */
const snake = {

    /**
     * Текущее направление движение змейки.
     * По умолчанию: направо, потому змейка при старте занимает первые три клетки.
     */
    direction: {},

    /**
     * Содержит массив объектов с координатами частей тела змейки.
     */
    parts: [],

    /**
     * Функция устанавливает направление движения.
     *
     * @param direction {'up' | 'down' | 'left' | 'right'} Направление движения змейки.
     */
    setDirection(direction) {
        /* проверка не пытается ли пользователь пойти в противоположном направлении,
         * например, змейка ползет вправо, а пользователь нажал стрелку влево */
        /* обратить внимание, как сделать красивее и сократить условие */
        if (this.direction === SNAKE_DIRECTION_UP && direction === SNAKE_DIRECTION_DOWN
            || this.direction === SNAKE_DIRECTION_DOWN && direction === SNAKE_DIRECTION_UP
            || this.direction === SNAKE_DIRECTION_LEFT && direction === SNAKE_DIRECTION_RIGHT
            || this.direction === SNAKE_DIRECTION_RIGHT && direction === SNAKE_DIRECTION_LEFT) {
            return;
        }

        this.direction = direction;
    },

    /**
     * Функция считает следующую позицию головы змейки,
     * в зависимости от текущего направления.
     *
     * @returns {{top: number, left: number}} Возвращает объект с координатами.
     */
    getNextPosition() {
        /* получаем позицию головы змейки */
        const position = { ...this.parts[this.parts.length - 1] };

        /* в зависимости от текущего положения
         * высчитываем значение от верхней и левой границы */
        switch(this.direction) {
            case SNAKE_DIRECTION_UP:
                position.top -= 1;
                break;
            case SNAKE_DIRECTION_DOWN:
                position.top += 1;
                break;
            case SNAKE_DIRECTION_LEFT:
                position.left -= 1;
                break;
            case SNAKE_DIRECTION_RIGHT:
                position.left += 1;
                break;
        }

        /* если змейка выходит за верхний или нижний край поля,
         * то изменяем координаты на противоположную сторону,
         * чтобы змейка выходя за границы возвращалась обратно на поле */
        if (position.top === -1) {
            position.top = config.size - 1;
        } else if (position.top > config.size - 1) {
            position.top = 0;
        }

        /* если змейка выходит за левый или правый край поля,
         * то изменяем координаты на противоположную сторону,
         * чтобы змейка выходя за границы возвращалась обратно на поле */
        if (position.left === -1) {
            position.left = config.size - 1;
        } else if (position.left > config.size - 1) {
            position.left = 0;
        }

        return position;
    },

    /**
     * Функция устанавливает позицию для змейки.
     *
     * @param position {{top: number, left: number}} Координаты новой позиции.
     * @param shift Флаг, указывающий, нужно ли отрезать хвост для змейки.
     */
    setPosition(position, shift = true) {
        /* проверяем флаг, указывающий, нужно ли отрезать хвост для змейки,
         * если флаг положительный, то отрезаем хвост змейки (первый элемент в массиве),
         * чтобы длина змейки не изменилась,
         * если флаг будет отрицательным, то при установки позиции, мы не отрезаем хвост,
         * а значит увеличиваем змейку на одну клетку, это будет означать, что она съела еду */
        if (shift) {
            cells.renderClearCell(this.parts[0]);
            this.parts.shift();
        }

        /* добавляем новые координаты в конец массива (голова змейки) */
        this.parts.push(position);
    },

    /**
     * Создает змейку заново
     */
    reset() {
        this.parts.length = 0;
        this.parts.push({ top: 0, left: 0 });
        this.parts.push({ top: 0, left: 1 });
        this.parts.push({ top: 0, left: 2 });

        this.direction = SNAKE_DIRECTION_RIGHT;
        
    },

    /**
     * Функция отрисовывает змейку на поле.
     */
    render() {
        cells.renderItems(this.parts, 'snake');
    }
};

/**
 * Объект, представляющий еду для змейки.
 */
const food = {

    /**
     * Содержит массив объектов с координатами еды на поле.
     */
    items: [],

    /**
     * Генерирует новый набор еды
     */
    reset() {
        this.items.length = 0;
        for (let i = 0; i < FOOD_MAX; i++) {
            this.generateItem();
        }
    },

    /**
     * Функция выполняет поиск переданных координат змейки в массиве с едой.
     *
     * @param snakePosition {{top: number, left: number}} Позиция головы змейки.
     *
     * @returns {number} Возвращает индекс найденного совпадения из массива с едой,
     * если ничего не найдено, то -1.
     */
    foundPosition(snakePosition) {
        /* здесь происходит вызов функции comparerFunction для каждого элемента в массиве,
         * если функция вернет true, то для этого элемента будет возвращен его индекс,
         * если функция ни разу не вернет true, то результатом будет -1 */
        return this.items.findIndex((item) =>
            item.top === snakePosition.top && item.left === snakePosition.left
        );
    },

    /**
     * Функция удаляет один элемент по индексу из массива с едой.
     *
     * @param foundPosition Индекс найденного элемента.
     */
    removeItem(foundPosition) {
        this.items.splice(foundPosition, 1);
    },

    /**
     * Функция генерирует объект с координатами новой еды.
     */
    generateItem() {
        const newItem = {
            top: getRandomNumber(0, config.size - 1),
            left: getRandomNumber(0, config.size - 1)
        };

        // добавить проверку нет ли у нас такого элемента

        this.items.push(newItem);
    },

    /**
     * Функция отрисовывает еду на поле.
     */
    render() {
        cells.renderItems(this.items, 'food');
    }
};

/**
 * Функция, которая выполняет инициализацию игры.
 */
function init() {
    /* получаем кнопки */
    const startButton = document.getElementById('button-start');
    const pauseButton = document.getElementById('button-pause');
    const stopButton = document.getElementById('button-stop');

    /* добавляем обработчики клика на кнопки */
    startButton.addEventListener('click', game.start.bind(game));
    pauseButton.addEventListener('click', game.pause.bind(game));
    stopButton.addEventListener('click', game.stop.bind(game));

    game.reset();

    /* добавляем обработчик при нажатии на любую кнопку на клавиатуре,
     * далее в методе мы будем проверять нужную нам клавишу */
    window.addEventListener('keydown', game.keysHandler.bind(game));

}

/**
 * Функция, генерирующая случайные числа.
 *
 * @param min {number} Нижняя граница генерируемого числа.
 * @param max {number} Верхняя граница генерируемого числа.
 *
 * @returns {number} Возвращает случайное число.
 */
function getRandomNumber(min, max) {
    return Math.trunc(Math.random() * (max - min) + min);
}

/**
 * Очищает DOM элемент от всех его дочерних элементов.
 * @param {*} item {object}
 */
function clearItem(item) {
    //Удаляем все внутренности из board
    while (item.firstChild) {
        item.firstChild.remove();
    }
    
}

window.addEventListener('load', init);
preloadImages([
    "ground", "food",
    "tail_d", "tail_u", "tail_l", "tail_r",
    "head_d", "head_u", "head_l", "head_r",
    "body_l_r", "body_r_l", "body_d_u", "body_u_d",
    "body_l_d", "body_l_u", "body_r_d", "body_r_u",
    "body_u_l", "body_u_r", "body_d_l", "body_d_r",
    ]);


/**
 * Предзагрузка изображений в кэш браузера
 * 
 * @param {*} array массив с набором имен изображений
 */
function preloadImages(array) {
    if (!preloadImages.list) {
        preloadImages.list = [];
    }
    var list = preloadImages.list;

    for (var i = 0; i < array.length; i++) {
        var img = new Image();
        img.onload = function() {
            var index = list.indexOf(this);
            if (index !== -1) {
                // удаление тайла из массива для экономии памяти
                list.splice(index, 1);
            }
        }
        list.push(img);
        img.src = TILE_PATH +  array[i] + TILE_EXT;
    }
}

