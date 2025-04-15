/**
 * Book
 * Author: Taigo Ito (https://qwel.design/)
 * Location: Fukui, Japan
 */

class Book {
  constructor() {
    this.elem = document.getElementById('book');
    if (!this.elem) return;

    // 要素生成
    // キャンバス
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('book__canvas');
    this.elem.appendChild(this.canvas);
    // ページ戻る
    this.prev = document.createElement('button');
    this.prev.classList.add('book__prev');
    const prevIcon = document.createElement('div');
    prevIcon.dataset.icon = 'ei-arrow-left';
    prevIcon.dataset.size = 'm';
    this.prev.appendChild(prevIcon);
    this.elem.appendChild(this.prev);
    // ページ進む
    this.next = document.createElement('button');
    this.next.classList.add('book__next');
    const nextIcon = document.createElement('div');
    nextIcon.dataset.icon = 'ei-arrow-right';
    nextIcon.dataset.size = 'm';
    this.next.appendChild(nextIcon);
    this.elem.appendChild(this.next);

    // 初期化
    this._setPages();
    this._handleEvents();
    this._windowResizeHandler();
  }

  _setPages() {
    this.currentPage = 0; // 現在ページ
    this.current = false; // false:左ページの操作 / true:右ページの操作
    this.flips = []; // 各ページの状態(progress, target, isDragging)
    this.timmmerId = null;
    this.pages = this.elem.querySelectorAll('.book__page');
    this.pages.forEach((page, i) => {
      page.style.zIndex = this.pages.length - i;
      this.flips.push({
        progress: 1, // flip中のページ端位置の割合
        target: 1, // flip中のポインター位置の割合
        page: page,
        isDragging: false // ドラグ操作中
      })
    });
  }

  _handleEvents() {
    // タッチデバイスの判定
    const touchSupported = 'ontouchstart' in document.documentElement || navigator.maxTouchPoints > 0;

    // 状態
    this._clientX = 0;
    this._clientY = 0;
    this._isDragging = false;

    // ドラグ操作
    if (touchSupported) {
      this.canvas.addEventListener('touchstart', (event) => {
        this._clientX = event.touches[0].clientX;
        this._clientY = event.touches[0].clientY;
        this._isDragging = true;
        this._myStartHandler();
      });

      this.canvas.addEventListener('touchmove', (event) => {
        this._clientX = event.touches[0].clientX;
        this._clientY = event.touches[0].clientY;
        this._myMoveHandler();
      });

      this.canvas.addEventListener('touchend', () => {
        this._myEndHandler();
        this._isDragging = false;
      });

      // touchcancelは、myEnd扱い
      this.canvas.addEventListener('touchcancel', () => {
        this._myEndHandler();
        this._isDragging = false;
      });
    }

    this.canvas.addEventListener('mousedown', (event) => {
      this._clientX = event.clientX;
      this._clientY = event.clientY;
      this._isDragging = true;
      this._myStartHandler();
      event.preventDefault();
    });

    this.canvas.addEventListener('mousemove', (event) => {
      this._clientX = event.clientX;
      this._clientY = event.clientY;
      this._myMoveHandler();
      event.preventDefault();
    });

    this.canvas.addEventListener('mouseup', () => {
      this._myEndHandler();
      this._isDragging = false;
    });

    // ポインターが外れたときは、myEnd扱い
    this.canvas.addEventListener('mouseleave', () => {
      this._myEndHandler();
      this._isDragging = false;
    });

    // ページ戻る
    this.prev.addEventListener('click', () => {
      this.flipPrev();
    });

    // ページ進む
    this.next.addEventListener('click', () => {
      this.flipNext();
    });

    // resize
    window.addEventListener('resize', () => this._windowResizeHandler());
  }

  // ドラグ開始処理
  _myStartHandler() {
    // キャンバスの中心を座標の中心としてポインターの位置を算出
    const rect = this.canvas.getBoundingClientRect();
    this._pointX = this._clientX - rect.x - rect.width / 2;
    this._pointY = this._clientY - rect.y - rect.height / 2;

    // ドラグ操作中は描画し、ドラグ操作を止めたら描画を停止する
    this._flipping();

    // flip中のポインター位置の割合
    const target = Math.max(Math.min(this._pointX / this.pageWidth, 1), -1);
    // 前ページに戻る（左ページ）操作
    // 前ページの全範囲をドラグ可能
    if ((-1 < target && target < 0) && this.currentPage > 0) {
      this.current = false;
      this.flips[this.currentPage - 1].isDragging = true;
    // 次ページへ進む（右ページ）操作
    // 次ページの端4分の1範囲のみドラグ可能
    } else if ((0.75 < target && target < 1) && this.currentPage < this.flips.length - 1) {
      this.current = true;
      this.flips[this.currentPage].isDragging = true;
    }
  }

  // ドラグ中処理
  _myMoveHandler() {
    // キャンバスの中心を座標の中心としてポインターの位置を算出
    const rect = this.canvas.getBoundingClientRect();
    this._pointX = this._clientX - rect.x - rect.width / 2;
    this._pointY = this._clientY - rect.y - rect.height / 2;

    if (!this._isDragging) {
      // flip中のポインター位置の割合
      const target = Math.max(Math.min(this._pointX / this.pageWidth, 1), -1);
      // 次ページへ進む（右ページ）操作（マウスオーバーで動作）
      // 次ページの端8分の1範囲のドラグを超えたら終了処理へ
      if ((0.875 < target && target < 1) && this.currentPage < this.flips.length - 1) {
        this._myStartHandler();
      } else {
        this._myEndHandler();
      }
    }
  }

  // ドラグ終了処理
  _myEndHandler() {
    this.flips.forEach((flip, i) => {
      if (flip.isDragging) {
        // 右ページの操作
        if (this.current) {
          // 4分の1範囲以上の操作（進む）
          if (flip.target < 0.75) {
            flip.target = -1;
            this.currentPage = Math.min(this.currentPage + 1, this.flips.length);
          // 4分の1範囲以内の操作（駐留）
          } else {
            flip.target = 1;
          }
        // 左ページの操作
        } else {
          // ポインターが左ページに達している（駐留）
          if (flip.target < 0) {
            flip.target = -1;
          // ポインターが右ページにある（戻る）
          } else {
            flip.target = 1;
            this.currentPage = Math.max(this.currentPage - 1, 0);
          }
        }
      }
      flip.isDragging = false;
    });
  }

  /* CSSに合わせて要カスタマイズ */
  _windowResizeHandler() {
    this.width = this.canvas.clientWidth; // キャンバス幅
    this.height = this.canvas.clientHeight; // キャンバス高さ（flip描画範囲を含む）
    this.pageX = this.canvas.clientWidth / 40; // ページ左右余白
    this.pageY = this.canvas.clientHeight / 16; // ページ上下余白 (1 - $flipRate) / 2
    this.pageWidth = this.width / 2 - this.pageX; // ページ幅
    this.pageHeight = this.height - this.pageY * 2; // ページ高さ
    this.bookMargin = this.canvas.clientWidth / 60; // 表紙縁
    this.bookWidth = (this.pageWidth + this.bookMargin) * 2;
    this.bookHeight = this.pageHeight + this.bookMargin * 2;
    this.canvas.setAttribute('width', this.width);
    this.canvas.setAttribute('height', this.height);
    this._draw(); // 再描画
  }

  _flipping(speed = 0.2) {
    clearInterval(this.timmmerId);
    this.timmmerId = setInterval(() => {
      this.flips.forEach((flip, i) => {
        if (flip.isDragging) {
          // flip中のポインター位置の割合
          flip.target = Math.max(Math.min(this._pointX / this.pageWidth, 1), -1);
        }
        // flip中のページ端位置の割合
        flip.progress += (flip.target - flip.progress) * speed;
        // 描画
        // progressを0.997で止めているのは、ページの重なりを表現するため
        if (flip.isDragging || Math.abs(flip.progress) < 0.997) {
          this._draw(flip);
        } else if (!flip.isDragging && Math.abs(flip.progress) < 0.997) {
          clearInterval(this.timmmerId); /* 実際は検出されず */
        }
      });
    }, 1000 / 60);
  }

  flipPrev() {
    if (this.currentPage > 0) {
      this.flips[this.currentPage - 1].target = 1;
      this.currentPage = Math.max(this.currentPage - 1, 0);
      this._flipping(0.1);
    }
  }

  flipNext() {
    if (this.currentPage < this.flips.length - 1) {
      this.flips[this.currentPage].target = -1;
      this.currentPage = Math.min(this.currentPage + 1, this.flips.length);
      this._flipping(0.1);
    }
  }

  _draw(flip) {
    this._clear();
    this._drawBook();
    this._drawPages();
    this._drawFlip(flip);
  }

  _clear() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);
  }

  _drawBook() {
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    // 表紙縁
    ctx.translate(this.pageX - this.bookMargin, this.pageY - this.bookMargin);
    ctx.fillStyle = '#bfb38c';
    ctx.shadowColor = 'rgba(0, 0, 0, .6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
    ctx.fillRect(0, 0, this.bookWidth, this.bookHeight);
    // 背表紙
    ctx.fillStyle = 'rgba(0, 0, 0, .3)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillRect(this.bookWidth * 0.488, 0, this.bookWidth * 0.024, this.bookHeight);
    // 背表紙右陰影
    ctx.strokeStyle = 'rgba(255, 255, 255, .3)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.bookWidth * 0.488, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, this.bookHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.bookWidth, 0);
    ctx.lineTo(this.bookWidth * 0.512, 0);
    ctx.lineTo(this.bookWidth * 0.512, this.bookHeight);
    ctx.stroke();
    // 背表紙左陰影
    ctx.strokeStyle = 'rgba(0, 0, 0, .3)';
    ctx.beginPath();
    ctx.moveTo(this.bookWidth * 0.488, 0);
    ctx.lineTo(this.bookWidth * 0.488, this.bookHeight);
    ctx.lineTo(0, this.bookHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.bookWidth, 0);
    ctx.lineTo(this.bookWidth, this.bookHeight);
    ctx.lineTo(this.bookWidth * 0.512, this.bookHeight);
    ctx.stroke();
    // ページ内透過
    ctx.translate(this.bookMargin, this.bookMargin);
    ctx.clearRect(0, 0, this.pageWidth * 2, this.pageHeight);
    ctx.restore(); // コンテキスト復元
  }

  _drawPages() {
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    // 左ページ陰影
    ctx.translate(this.pageX, this.pageY);
    ctx.strokeStyle = 'rgba(0, 0, 0, .6)';
    ctx.lineWidth = 0.5;
    let foldGradient = ctx.createLinearGradient(this.pageWidth * 0.75, 0, this.pageWidth, 0);
    foldGradient.addColorStop(0.0, '#ffffff');
    foldGradient.addColorStop(0.7, '#eeeeee');
    foldGradient.addColorStop(0.9, '#ffffff');
    foldGradient.addColorStop(1.0, '#dddddd');
    ctx.fillStyle = foldGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.pageWidth, 0);
    ctx.lineTo(this.pageWidth, this.pageHeight);
    ctx.lineTo(0, this.pageHeight);
    ctx.stroke();
    ctx.fill();
    // 右ページ陰影
    ctx.translate(this.pageWidth, 0);
    foldGradient = ctx.createLinearGradient(this.pageWidth * 0.25, 0, 0, 0);
    foldGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
    foldGradient.addColorStop(0.9, 'rgba(221, 221, 221, .5)');
    foldGradient.addColorStop(1.0, 'rgba(102, 102, 102, .5)');
    ctx.fillStyle = foldGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.pageWidth, 0);
    ctx.lineTo(this.pageWidth, this.pageHeight);
    ctx.lineTo(0, this.pageHeight);
    ctx.stroke();
    ctx.fill();
    ctx.restore(); // コンテキスト復元
  }

  _drawFlip(flip) {
    if (!flip) {
      flip = {
        progress: 1,
        target: 1
      };
    }
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    const strength = 1 - Math.abs(flip.progress);
    const foldWidth = this.pageWidth / 2 * (1 - flip.progress);
    const foldX = this.pageWidth * flip.progress + foldWidth;
    const verticalOutdent = this.pageY * 6 / 8 * strength; // 1 / $flipRate未満
    const rightShadowWidth = this.pageWidth / 2 * Math.max(Math.min(strength, 0.5), 0);
    const leftShadowWidth = this.pageWidth / 2 * Math.max(Math.min(strength, 0.5), 0);
    const paperShadowWidth = this.pageWidth / 2 * Math.max(Math.min(1 - flip.progress, 0.5), 0);
    // flip中の表示操作
    if (flip.page) {
      // ポインターがページ中央を跨ぐ時に表示を切り替え
      if (flip.progress < 0) {
        flip.page.style.display = 'none';
      } else {
        flip.page.style.display = '';
        // flip中のページの表示幅を操作(位置は左側にfix)
        flip.page.style.width = Math.max(foldX, 0) + 'px';
      }
    }
    // ページの重なり
    ctx.translate(this.pageWidth + this.pageX, this.pageY);
    ctx.strokeStyle = 'rgba(0, 0, 0, .6)';
    ctx.lineWidth = 0.5;
    ctx.fillStyle = '#eeeeee';
    let leftPages = 0;
    let rightPages = -1;
    this.flips.forEach((flips, i) => {
      if (flip.progress < -0.997) {
        leftPages++;
      } else if (flip.progress > 0.997) {
        rightPages++;
      }
    });
    leftPages = Math.min(leftPages, 2);
    // 左ページの重なり
    for (let i = 0; leftPages >= 0 ? i < leftPages : i > leftPages; i = leftPages >= 0 ? ++i : --i) {
      ctx.beginPath();
      ctx.moveTo(-this.pageWidth - i * 2, i * 0.625);
      ctx.lineTo(-this.pageWidth - i * 2, this.pageHeight + i * 0.625);
      ctx.lineTo(-i * 2, this.pageHeight + i * 0.625);
      ctx.lineTo(-i * 2, this.pageHeight + (i + 1) * 0.625);
      ctx.lineTo(-this.pageWidth - (i + 1) * 2, this.pageHeight + (i + 1) * 0.625);
      ctx.lineTo(-this.pageWidth - (i + 1) * 2, i * 0.625);
      ctx.stroke();
      ctx.fill();
    }
    // 右ページの重なり
    rightPages = Math.min(rightPages, 2);
    for (let i = 0; rightPages >= 0 ? i < rightPages : i > rightPages; i = rightPages >= 0 ? ++i : --i) {
      ctx.beginPath();
      ctx.moveTo(this.pageWidth + i * 2, i * 0.625);
      ctx.lineTo(this.pageWidth + i * 2, this.pageHeight + i * 0.625);
      ctx.lineTo(i * 2, this.pageHeight + i * 0.625);
      ctx.lineTo(i * 2, this.pageHeight + (i + 1) * 0.625);
      ctx.lineTo(this.pageWidth + (i + 1) * 2, this.pageHeight + (i + 1) * 0.625);
      ctx.lineTo(this.pageWidth + (i + 1) * 2, i * 0.625);
      ctx.stroke();
      ctx.fill();
    }
    // flip左の強い陰影
    ctx.strokeStyle = `rgba(0, 0, 0, ${strength * 0.05})`;
    ctx.lineWidth = 30 * strength;
    ctx.beginPath();
    ctx.moveTo(foldX - foldWidth, -verticalOutdent * 0.5);
    ctx.lineTo(foldX - foldWidth, this.pageHeight + verticalOutdent * 0.5);
    ctx.stroke();
    // flip右の弱い陰影
    const rightShadowGradient = ctx.createLinearGradient(foldX, 0, foldX + rightShadowWidth, 0);
    rightShadowGradient.addColorStop(0, `rgba(0, 0, 0, ${(strength * 0.2).toFixed(2)})`);
    rightShadowGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rightShadowGradient;
    ctx.fillRect(foldX, 0, foldX + rightShadowWidth, this.pageHeight);
    // flip左の弱い陰影
    const leftShadowGradient = ctx.createLinearGradient(foldX - foldWidth - leftShadowWidth, 0, foldX - foldWidth, 0);
    leftShadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    leftShadowGradient.addColorStop(1, `rgba(0, 0, 0, ${(strength * 0.15).toFixed(2)})`);
    ctx.fillStyle = leftShadowGradient;
    ctx.fillRect(foldX - foldWidth - leftShadowWidth, 0, leftShadowWidth, this.pageHeight);
    // flip中のページ
    ctx.strokeStyle = 'rgba(0, 0, 0, .6)';
    ctx.lineWidth = 0.5;
    const foldGradient = ctx.createLinearGradient(foldX - paperShadowWidth, 0, foldX, 0);
    foldGradient.addColorStop(0.35, '#ffffff');
    foldGradient.addColorStop(0.73, '#eeeeee');
    foldGradient.addColorStop(0.9, '#ffffff');
    foldGradient.addColorStop(1.0, '#dddddd');
    ctx.fillStyle = foldGradient;
    ctx.beginPath();
    ctx.moveTo(foldX, this.pageHeight);
    ctx.quadraticCurveTo(foldX, this.pageHeight + verticalOutdent * 2, foldX - foldWidth, this.pageHeight + verticalOutdent);
    ctx.lineTo(foldX - foldWidth, -verticalOutdent);
    ctx.quadraticCurveTo(foldX, -verticalOutdent * 2, foldX, 0);
    ctx.stroke();
    ctx.fill();
    ctx.restore(); // コンテキスト復元
  }
}

new Book();
