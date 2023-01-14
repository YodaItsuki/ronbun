class seigyo{ //audiocontextとボリュームのノードとEQのノードのクラス
  constructor(audioCtx,gainNode,eqnodes,analyserNode_before,analyserNode_after,Pannode,preset_temp,preset_name){
    this.audioCtx = audioCtx;
    this.gainNode = gainNode;
    this.eqnodes = eqnodes;
    this.Pannode = Pannode;
    this.analyserNode_before = analyserNode_before;
    this.analyserNode_after = analyserNode_after;
    this.name = preset_name;
    if(preset_temp != undefined){
      this.EQtemp = preset_temp; //EQのgainの値を保存する変数 エフェクトオンオフの時に使う
    }
    else{
      this.EQtemp = []; //EQのgainの値を保存する変数 エフェクトオンオフの時に使う
      for(var i = 0; i < bands; i++) {
        this.EQtemp[i] = 0;
      }
    }
  }

  touroku(element,sentaku){
    this.audio = element.querySelector('#audio');
    this.audio.onloadedmetadata = function() {
      this.timeset(element.querySelector('#audio').duration);
    }.bind(this);
    this.filesousin = element.querySelector('#filesousin');
    this.kirikae = element.querySelector('#kirikae');
    this.effect_switch = element.querySelector('#effect_switch');
    this.mute_button = element.querySelector('#mute');
    this.solo_button = element.querySelector('#solo');
    this.reset_button = element.querySelector('#reset');
    this.audio_name = element.querySelector('#audio_name');
    this.select_mark = element.querySelector('#select_mark'); //現在選択している音源のマークの表示
    this.select_mark.style.color = "red";
    this.volume_temp = 1; //ボリュームの値の一時保存の変数　ミュートとソロの時に使う
    this.effect_switch_flag = false; //エフェクトオンオフ判定のフラグ
    this.mute_flag = false; //ミュートの判定のフラグ
    this.solo_flag = false; //ソロの判定のフラグ
    this.filesousin.addEventListener( 'change', () => { //ファイルを選択した時の動作
      this.reader = new FileReader();
      this.file = this.filesousin.files[0];
      this.url;
      this.name = this.filesousin.files[0].name; //ファイル名を取得
      this.reader.onload = () => {
        this.url = this.reader.result;
        this.sousin(this.url);
      };
      this.reader.readAsDataURL(this.file);
    } );
    this.kirikae.addEventListener( 'click', () => {this.kirikaeru()} );
    this.effect_switch.addEventListener( 'click', () => {this.switch()} );
    this.mute_button.addEventListener( 'click', () => {this.mute()} );
    this.solo_button.addEventListener( 'click', () => {this.solo()} );
    this.reset_button.addEventListener( 'click', () => {this.reset()} );
    this.sentaku = sentaku; //配列内の何番目のインスタンスなのか
    this.sousakinshi = false; //EQが操作禁止かどうかを判定する変数 falseが操作できる trueが操作不可
    this.sousin();
  }

  timeset(duration){ //再生位置の調整スライダーの値を変える
    if(saiseiichi.max == 0){
      saiseiichi.max = duration;
      for(var i = 0 ; i < audio.length ; i++){
        if(saiseiichi.max == audio[i].duration){
          max_audio = i; //一番再生時間が長い音源が何番目なのかの変数
        }
      }
    }
    else{
      if(saiseiichi.max < duration){ //もし読み込んだ音源が再生位置のスライダーの最大の値を超えた場合
        saiseiichi.max = duration; //再生位置のスライダーの最大の値変える
      }
      for(var i = 0 ; i < audio.length ; i++){
        if(saiseiichi.max == audio[i].duration){ //すべての音源と比較して読み込んだ音源の時間が一番長いときの動作
          max_audio = i;
        }
      }
    }
  }

  sousin(url) { //ファイルを選択したときの動作 audioタグのsrcに入れて各ノードを接続
    for(var i = 0; i < audio.length; i++){ //一旦すべてのトラックの再生を停止して、再生位置を一番最初に戻す
      audio[i].pause();
      audio[i].currentTime = 0; 
    }
    this.audio_name.textContent = this.name; //選択したファイルの名前を表示
    sentaku_audio.textContent = seigyo_elements[sentaku].name; //選択中のファイルの名前を表示
    douji.value = "再生";
    saisei_flag = false;
    if(url != undefined){
      this.audio.src = url;
    }
    if(this.source == null){
      this.source = this.audioCtx.createMediaElementSource(this.audio); //ノード作成
    }
    //ノードの接続 入力→ボリューム→パン→EQ→出力
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.Pannode);
    this.Pannode.connect(this.eqnodes[0]);
    this.gainNode.connect(this.analyserNode_before); //エフェクトをかける前のアナライザー
    for(var i = 1; i < bands; i++) {
      if(i != bands-1){
        this.eqnodes[i-1].connect(this.eqnodes[i]);
      }
      else{
        this.eqnodes[i-1].connect(this.eqnodes[i]);
        this.eqnodes[i].connect(this.analyserNode_after); //エフェクトをかけた後のアナライザー
        this.eqnodes[i].connect(this.audioCtx.destination);
      }
    }
    if(douji.disabled == true){ //再生が操作不可の時の動作
      douji.disabled = false; //再生をボタンを押せるようにする
      saiseiichi.disabled = false; //再生位置を調整できるようにする
    }
  }

  switch(){ //Bypassを押したときの動作
    if(this.effect_switch_flag == false){ //エフェクトオフ・オンのボタンがエフェクトオフの時
      for(var i = 0; i < bands; i++) { //EQをすべての値を0にする
        this.EQtemp[i] = this.eqnodes[i].gain.value;
        this.eqnodes[i].gain.value = 0;
        if(this.sentaku == EQ[i].sentaku){ //EQを適応する音源を選択して、その選択中の音源のエフェクトをオンオフするときだけ変更する
          EQ[i].db.disabled = true; //EQのスライダーを操作不能にする
        }
      }
      this.sousakinshi = true; //EQが操作できるかどうかのフラグをtrueにする
      this.effect_switch.style.backgroundColor = "red";
      this.effect_switch.style.color = "white";
      this.effect_switch_flag = true; //ボタンの文字を変える
    }
    else if(this.effect_switch_flag == true){ //エフェクトオフ・オンのボタンがエフェクトオンの時
      for(var i = 0; i < bands; i++) { //EQtempに保存しておいた値を戻す
        this.eqnodes[i].gain.value = this.EQtemp[i];
        if(this.sentaku == EQ[i].sentaku){
          EQ[i].db.disabled = false; //スライダーを操作できるようにする
        }
      }
      this.effect_switch.style.backgroundColor = "#F0F0F0";
      this.effect_switch.style.color = "black";
      this.sousakinshi = false; //EQが操作できるかどうかのフラグをfalseにする
      this.effect_switch_flag = false; //ボタンの文字を変える
    }
  }

  kirikaeru() { //切り替えを押したときの動作
    seigyo_elements[sentaku].select_mark.textContent = "";
    sentaku = this.sentaku; //どれを操作しているかをこのインスタンスの配列の番号にする
    //各エフェクターの値をその音源の値にする
    this.select_mark.textContent = "●";
    sentaku_audio.textContent = this.name;
    volume.value = this.volume_temp;
    volumedb.textContent = Math.round(volume.value * 100);
    pan.value = this.Pannode.pan.value;
    if(pan.value == 0){
      direction.textContent = "C";
    }
    else if(pan.value < 0){
      direction.textContent = "L" + Math.round(Math.abs(pan.value) * 100);
    }
    else{
      direction.textContent = "R" + Math.round(pan.value * 100);
    }
    for(var i = 0; i < bands; i++) {
      EQ[i].sentaku = this.sentaku;
      EQ[i].db.value = this.EQtemp[i];
      EQ[i].dbview.textContent = this.EQtemp[i];
      if(this.sousakinshi == false){
        EQ[i].db.removeAttribute("disabled");
      }
      else{
        EQ[i].db.setAttribute("disabled","");
      }
    }
    if(this.mute_flag == true){ //ミュートかどうかを判定するフラグがtrueの時
      volume.disabled = true; //ボリュームを操作不可にする
      volume.value = this.volume_temp; //一時保存したボリュームの値を表示するようにする
    }
    else{
      volume.disabled = false; //ボリュームを操作できるようにする
    }
  }

  mute(){ //ミュートが押されたときの動作
    if(this.mute_flag == false){
      this.gainNode.gain.value = 0; //ボリュームの値を0にする
      if(sentaku == this.sentaku){ //この音源が選択されているとき
        volume.disabled = true;
      }
      this.mute_button.style.backgroundColor = "red";
      this.mute_button.style.color = "white";
      this.mute_flag = true; //ミュートしてるかどうかのフラグをtrueに変える
    }
    else{
      this.gainNode.gain.value = this.volume_temp; //一時保存していたボリュームの値を戻す
      if(sentaku == this.sentaku){ //この音源が選択されているとき
        volume.disabled = false;
      }
      this.mute_button.style.backgroundColor = "#F0F0F0";
      this.mute_button.style.color = "black";
      this.mute_flag = false; //フラグをfalseに変える
    }
  }

  solo(){ //ソロが押されたときの動作
    if(this.solo_flag == false){ //ソロを判定するフラグがfalseの時
      for(var i = 0; i < number_of_seigyo; i++) {
        if(i != this.sentaku){ //iがソロをする音源でないとき
          seigyo_elements[i].gainNode.gain.value = 0; //iの音源のボリュームを0にする
          seigyo_elements[i].mute_button.disabled = true; //iの音源のミュートのボタンを操作不可にする
          seigyo_elements[i].solo_button.disabled = true; //iの音源のソロのボタンを操作不可にする
        }
      }
      this.solo_button.style.backgroundColor = "red";
      this.solo_button.style.color = "white";
      this.solo_flag = true; //ソロを判定するフラグをtrueに変える
    }
    else{
      for(var i = 0; i < number_of_seigyo; i++) {
        if(i != this.sentaku){ //iがソロをする音源でないとき
          if(seigyo_elements[i].mute_flag == true){ //iの音源がミュートになっている場合
            seigyo_elements[i].gainNode.gain.value = 0; //iの音源を0にする
          }
          else{ //iの音源がミュートではない場合
            seigyo_elements[i].gainNode.gain.value = seigyo_elements[i].volume_temp; //一時保存していたボリュームを戻す
          }
          seigyo_elements[i].mute_button.disabled = false; //iの音源のミュートのボタンを操作できるようにする
          seigyo_elements[i].solo_button.disabled = false;//iの音源のソロのボタンを操作できるようにする
        }
      }
      this.solo_button.style.backgroundColor = "#F0F0F0";
      this.solo_button.style.color = "black";
      this.solo_flag = false; //ソロを判定するフラグをfalseにする
    }
  }

  reset(){
    this.result = confirm("トラックをリセットします。よろしいですか？")
    if( this.result ) {
      //audioのsrcを空にして表示を消す
      this.audio.src = "";
      this.audio_name.textContent = "";
      this.name = "";
      if(sentaku == this.sentaku){
        sentaku_audio.textContent = "";
      }
      for(var i = 0; i < audio.length; i++){
        if(audio[i].src != ""){
          saiseiichi.max = 0; //いったん再生位置のinputの最大値を0にしておく
          for(var i = 0; i < audio.length; i++){
              if(saiseiichi.max < audio[i].duration){
              saiseiichi.max = audio[i].duration;
            }
          }
          for(var i = 0; i < audio.length; i++){
            audio[i].pause();
            audio[i].currentTime = 0;  //いったんすべての音源を停止して再生位置を0に戻す
            if(saiseiichi.max == audio[i].duration){
              max_audio = i;
            }
          }
          saisei_flag = false;
          douji.value = "再生";
          for(var i = 0; i < bands; i++) { //EQをすべての値を0にする
            this.EQtemp[i] = 0;
            this.eqnodes[i].gain.value = 0;
          }
          this.gainNode.gain.value = 1;
          this.volume_temp = 1;
          this.Pannode.pan.value = 0;
          if(sentaku == this.sentaku){ //この音源が選択されているとき
            for(var i = 0; i < bands; i++) { //EQをすべての値を0にする
              EQ[i].db.value = 0;
              EQ[i].dbview.textContent = 0;
            }
            volume.value = 1;
            pan.value = 0;
            volumedb.textContent = 100;
            direction.textContent = "C";
          }
          break;
        }
      }
    }
  else {}
  }
}

class EQset{ //EQを操作するクラス
  constructor( eq_element,i ){
    this.db = eq_element.querySelector('#eq');//EQのinputタグ
    this.dbview = eq_element.querySelector('#eqdb'); //db数を表示するspanタグ
    this.db.addEventListener( 'input', () => {this.dbset()} ); //EQのスライダーを動かしたときの動作
    this.i = i;
    this.sentaku = 0; //EQを適応する音源の選択、デフォルトで一つ目の音源が選択されている
    this.db.value = seigyo_elements[0].EQtemp[i]; //プリセットの値に書き換える
    this.dbview.textContent = this.db.value;
  }

  dbset() {
    seigyo_elements[this.sentaku].eqnodes[this.i].gain.value = this.db.value; //EQのgainを書き換える
    this.dbview.textContent = this.db.value; //スライダーの横のdb数の表示を変える
    seigyo_elements[this.sentaku].EQtemp[this.i] = this.db.value;
  }
}

//ここまでクラス

var audio = []
var douji = document.querySelector('#douji');
var saiseijikan = document.querySelector('#saiseijikan');
var max_audio; //一番再生時間が長い音源の要素の場所
var saisei_flag = false; //再生してるかどうかを判定するフラグ
for( let element of document.querySelectorAll('.seigyo') ) {
  audio.push(element.querySelector('#audio'));
}
douji.addEventListener('click', function( event ) { //再生のボタンを押したときの動作
  if(saisei_flag == false){
    for(var i = 0; i < audio.length; i++){
      audio[i].play();
    }
    audio[max_audio].addEventListener('timeupdate', function( event ){
      if(Math.floor(audio[max_audio].currentTime % 60).toString().length == 1){
        var sec = "0" + Math.floor(audio[max_audio].currentTime % 60);
      }
      else{
        var sec = Math.floor(audio[max_audio].currentTime % 60);
      }
      var min = Math.floor(audio[max_audio].currentTime / 60);
      saiseijikan.textContent = min + ":" + sec;
      saiseiichi.value = audio[max_audio].currentTime;

    }, true);
    saisei_flag = true;
    douji.value = "停止";
  }
  else{
    for(var i = 0; i < audio.length; i++){
      audio[i].pause();
    }
    saisei_flag = false;
    douji.value = "再生";
  }
});

var saiseiichi = document.querySelector('#saiseiichi');
saiseiichi.addEventListener('input', function( event ) { //再生位置のスライダーを動かしたときの動作
  for(var i = 0; i < audio.length; i++){
    if(audio[i].duration > saiseiichi.value){
      audio[i].currentTime = saiseiichi.value;
      if(saisei_flag == true){
        audio[i].play();
      }
    }
  }
  if(Math.floor(audio[max_audio].currentTime % 60).toString().length == 1){
    var sec = "0" + Math.floor(audio[max_audio].currentTime % 60);
  }
  else{
    var sec = Math.floor(audio[max_audio].currentTime % 60);
  }
  var min = Math.floor(audio[max_audio].currentTime / 60);
  saiseijikan.textContent = min + ":" + sec;
  saiseiichi.value = audio[max_audio].currentTime;
});

var volume = document.querySelector('#volume');
var volumedb = document.querySelector('#volumedb');
volume.addEventListener('input', function( event ) { //volumeのスライダーを動かしたときの動作
  seigyo_elements[sentaku].gainNode.gain.value = volume.value;
  seigyo_elements[sentaku].volume_temp = volume.value; //ボリュームの値の一時保存 ミュートとソロの時に使う
  volumedb.textContent = Math.round(volume.value * 100);
});

var pan = document.querySelector('#pan');
var direction = document.querySelector('#direction');
pan.addEventListener('input', function( event ) { //panのスライダーを動かしたときの動作
  seigyo_elements[sentaku].Pannode.pan.value = pan.value;
  if(pan.value == 0){
    direction.textContent = "C";
  }
  else if(pan.value < 0){
    direction.textContent = "L" + Math.round(Math.abs(pan.value) * 100);
  }
  else{
    direction.textContent = "R" + Math.round(pan.value * 100);
  }
});

var sentaku_audio = document.querySelector('#sentaku_audio'); //現在選択している音源の表示

//ここからアナライザーの描画
var analizer_canvas = document.querySelector('#analizer_canvas');
var analizer_canvas_ctx = analizer_canvas.getContext('2d');
var analizer_canvas_text = document.querySelector('#analizer_canvas_text');
var analizer_canvas_text_ctx = analizer_canvas_text.getContext('2d');
var zahyou_sa = (analizer_canvas_text.height - analizer_canvas.height) / 2; //グラフを描画するcanvasとテキストとグリッドを表示するcanbasの間にできる空白の大きさ
var x,y;
var Hz = [20,50,100,200,500,1000,2000,5000,10000,20000];

//グリッドとテキストの描画
analizer_canvas_text_ctx.beginPath();
//ここから横線
for(var i = 0 ; i < 7 ; i++){
  analizer_canvas_text_ctx.moveTo( zahyou_sa , zahyou_sa + (analizer_canvas.height / 6) * i);
  analizer_canvas_text_ctx.lineTo( zahyou_sa + analizer_canvas.width, zahyou_sa + (analizer_canvas.height / 6) * i );
  analizer_canvas_text_ctx.font = '11pt sans-serif';
  var measure = analizer_canvas_text_ctx.measureText( -20 * i );
  analizer_canvas_text_ctx.fillText( -20 * i , zahyou_sa - 30 - (measure.width / 2), zahyou_sa + (analizer_canvas.height / 6) * i);
}
var measure = analizer_canvas_text_ctx.measureText( "[db]" );
analizer_canvas_text_ctx.fillText( "[db]" , zahyou_sa - 30 - (measure.width / 2), 25);
//ここから縦線
for(var i = 0 ; i < 10 ; i++){
  analizer_canvas_text_ctx.moveTo( zahyou_sa + (analizer_canvas.width / 9) * i , zahyou_sa );
  analizer_canvas_text_ctx.lineTo( zahyou_sa + (analizer_canvas.width / 9) * i, analizer_canvas_text.height - zahyou_sa );
  analizer_canvas_text_ctx.font = '11pt sans-serif';
  var measure = analizer_canvas_text_ctx.measureText(Hz[i]);
  analizer_canvas_text_ctx.fillText(Hz[i] , (zahyou_sa + (analizer_canvas.width / 9) * i) - (measure.width / 2), (analizer_canvas_text.height - zahyou_sa) + 30);
}
var measure = analizer_canvas_text_ctx.measureText("[Hz]");
  analizer_canvas_text_ctx.fillText("[Hz]" , analizer_canvas_text.width - 25 - (measure.width / 2), (analizer_canvas_text.height - zahyou_sa) + 10);

analizer_canvas_text_ctx.strokeStyle = "rgb(255,150,150)";
analizer_canvas_text_ctx.stroke() ;

window.setInterval(function() { //描画を繰り返す
  var spectrums_before = new Float32Array(1024);
  seigyo_elements[sentaku].analyserNode_before.getFloatFrequencyData(spectrums_before);
  var range = seigyo_elements[sentaku].analyserNode_before.maxDecibels - seigyo_elements[sentaku].analyserNode_before.minDecibels;

  analizer_canvas_ctx.clearRect(0, 0, analizer_canvas.width, analizer_canvas.height);
  analizer_canvas_ctx.beginPath();
  analizer_canvas_ctx.strokeStyle = 'silver';
  for (var i = 1, len = 929; i <= len; i++) { //1番目が大体20Hz 929番目が大体20kHz
    if(i < 3){ x = ((analizer_canvas.width / 9) / 2) * (i - 1); } //60Hzまでのx
    else if(i < 5){ x = (analizer_canvas.width / 9) + ((analizer_canvas.width / 9) / 2) * (i - 3); } //100Hzまでのx
    else if(i < 9){ x = (analizer_canvas.width / 9) * 2 + ((analizer_canvas.width / 9) / 4) * (i - 5); } //200Hzまでのx
    else if(i < 23){ x = (analizer_canvas.width / 9) * 3 + ((analizer_canvas.width / 9) / 14) * (i - 9); } //500Hzまでのx
    else if(i < 46){ x = (analizer_canvas.width / 9) * 4 + ((analizer_canvas.width / 9) / 23) * (i - 23); } //1000Hzまでのx
    else if(i < 93){ x = (analizer_canvas.width / 9) * 5 + ((analizer_canvas.width / 9) / 47) * (i - 46); } //2000Hzまでのx
    else if(i < 232){ x = (analizer_canvas.width / 9) * 6 + ((analizer_canvas.width / 9) / 139) * (i - 93); } //5000Hzまでのx
    else if(i < 464){ x = (analizer_canvas.width / 9) * 7 + ((analizer_canvas.width / 9) / 232) * (i - 232); } //10000Hzまでのx
    else if(i <= 929){ x = (analizer_canvas.width / 9) * 8 + ((analizer_canvas.width / 9) / 466) * (i - 464); } //20000Hzまでのx

    y = (-1 * ((spectrums_before[i] - seigyo_elements[sentaku].analyserNode_before.maxDecibels) / range)) * analizer_canvas.height;

    if (i === 0) {
      analizer_canvas_ctx.moveTo(x, y);
    } else {
        analizer_canvas_ctx.lineTo(x, y);
    }
  }
  analizer_canvas_ctx.stroke();

  var spectrums_after = new Float32Array(1024);
  seigyo_elements[sentaku].analyserNode_after.getFloatFrequencyData(spectrums_after);
  var range = seigyo_elements[sentaku].analyserNode_after.maxDecibels - seigyo_elements[sentaku].analyserNode_after.minDecibels;
  analizer_canvas_ctx.beginPath();
  analizer_canvas_ctx.strokeStyle = 'black';
  for (var i = 1, len = 929; i <= len; i++) {
    if(i < 3){ x = ((analizer_canvas.width / 9) / 2) * (i - 1); } //60Hzまでのx
    else if(i < 5){ x = (analizer_canvas.width / 9) + ((analizer_canvas.width / 9) / 2) * (i - 3); } //100Hzまでのx
    else if(i < 9){ x = (analizer_canvas.width / 9) * 2 + ((analizer_canvas.width / 9) / 4) * (i - 5); } //200Hzまでのx
    else if(i < 23){ x = (analizer_canvas.width / 9) * 3 + ((analizer_canvas.width / 9) / 14) * (i - 9); } //500Hzまでのx
    else if(i < 46){ x = (analizer_canvas.width / 9) * 4 + ((analizer_canvas.width / 9) / 23) * (i - 23); } //1000Hzまでのx
    else if(i < 93){ x = (analizer_canvas.width / 9) * 5 + ((analizer_canvas.width / 9) / 47) * (i - 46); } //2000Hzまでのx
    else if(i < 232){ x = (analizer_canvas.width / 9) * 6 + ((analizer_canvas.width / 9) / 139) * (i - 93); } //5000Hzまでのx
    else if(i < 464){ x = (analizer_canvas.width / 9) * 7 + ((analizer_canvas.width / 9) / 232) * (i - 232); } //10000Hzまでのx
    else if(i <= 929){ x = (analizer_canvas.width / 9) * 8 + ((analizer_canvas.width / 9) / 466) * (i - 464); } //20000Hzまでのx

    y = (-1 * ((spectrums_after[i] - seigyo_elements[sentaku].analyserNode_after.maxDecibels) / range)) * analizer_canvas.height;

    if (i === 0) {
      analizer_canvas_ctx.moveTo(x, y);
    } else {
      analizer_canvas_ctx.lineTo(x, y);
    }
  }
  analizer_canvas_ctx.stroke();
}, 50);

//ここまでアナライザーの描画

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var number_of_seigyo = 6; //制御する音源の数
var seigyo_elements = new Array(number_of_seigyo); //音源の制御する配列

var preset = []; //demoのプリセットを格納する配列
preset[0] = [-37,-18,0,0,0,0,0,0,0,0];
preset[1] = [0,0,0,0,-2,-3,-2,0,0,0];
preset[2] = [-15,-6,0,0,-3,-4,-3,0,0,0];
preset[3] = [-22,-12,-4,0,-3,-4,-3,0,0,0];
preset[4] = [0,0,0,-2,-4,-8,-15,-23,-32,-40];
var preset_name = ["Vocal.mp3","Drums.mp3","Piano.mp3","Guitar.mp3","Bass.mp3"];

for(var i = 0; i < number_of_seigyo; i++) {
  var audioCtx = new AudioContext();
  var gainNode = audioCtx.createGain(); //ボリュームを変えるノードを作成
  var Pannode = audioCtx.createStereoPanner(); //パンのノード

  var analyserNode_before = audioCtx.createAnalyser(); //エフェクターで効果を与える前のアナライザー
  analyserNode_before.fftSize = 2048;
  analyserNode_before.minDecibels = -120;
  analyserNode_before.maxDecibels = 0;

  var analyserNode_after = audioCtx.createAnalyser(); //エフェクターで効果を与えた後のアナライザー
  analyserNode_after.fftSize = 2048;
  analyserNode_after.minDecibels = -120;
  analyserNode_after.maxDecibels = 0;
  var bands = 10; //帯域の数
  var frequency = 31.25; //中心の周波数 62.5 125 250 500 1000 2000 4000 8000 16000と増えていく
  var eqnodes = new Array(bands); //インスタンスを格納する配列
  var preset_temp = preset[i]; //presetの中の配列を取り出す
  for(var j = 0; j < bands; j++) {
    var eqnode = audioCtx.createBiquadFilter(); //EQのノードを作成
    eqnode.type = (typeof eqnode.type === 'string') ? 'peaking' : 5;
    eqnode.frequency.value = frequency; //調整する中心の周波数
    frequency = frequency * 2; //中心の周波数を2倍する
    eqnode.Q.value = 2; //帯域幅の設定
    if(preset_temp != undefined){
      eqnode.gain.value = preset_temp[j]; //デフォルトのゲイン
    }
    else{
      eqnode.gain.value = 0;
    }
    eqnodes[j] = eqnode; //配列にインスタンスを格納
  }
  seigyo_elements[i] = new seigyo(audioCtx,gainNode,eqnodes,analyserNode_before,analyserNode_after,Pannode,preset_temp,preset_name[i]); //音源の制御のインスタンスを格納
}

var sentaku = 0; //いまどの音源を操作するのかの値

var source = new Array(number_of_seigyo);
var url; //src

var i = 0;
for( let element of document.querySelectorAll('.seigyo') ) { //インスタンスを生成
  seigyo_elements[i].touroku( element,i );
  i++;
}

let EQ = [];
var i = 0;
for( let eq_element of document.querySelectorAll('.EQ') ) {
    EQ.push( new EQset( eq_element,i ) );
    i++;
}
