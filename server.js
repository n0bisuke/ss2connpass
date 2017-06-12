'use strict'

const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: true });
const EVENT_ID = require(`./config`).connpass.iotlt.eventid;
const USER_ID = require(`./config`).auth.user;
const PASS = require(`./config`).auth.pass;
const SS = require('./_ss_connpass');
const SS_ID = require(`./config`).connpass.iotlt.ss_id;
const SS_RANGE = require(`./config`).connpass.iotlt.ss_range;

//書き換えテキスト
const contentRewrite = (text) => {
  return new Promise((resolve, reject) => {
    SS(SS_ID, SS_RANGE)
    .then((ss_text) => {
      console.log(ss_text);
      resolve(text.replace(/\|\|([\s\S]*)\|21:00/, ss_text)); //SSのテキストに書き換え
    }).catch(err => reject(err));
  });
}

const getEventBody = () => {
  return nightmare
    //ログイン
    .goto(`https://connpass.com/login/?next=https%3A//connpass.com/event/${EVENT_ID}/`)
    .type(`input[name=username]`,USER_ID)
    .type(`input[name=password]`,PASS)
    .click(`#login_form .btn_default`)
    //編集ボタンをクリック
    .wait(`.icon_gray_edit`)
    .click(`.icon_gray_edit`)
    //イベントの説明をクリック
    .wait(`#FieldDescription`)
    .click(`#FieldDescription`)
    .wait(1000)
    .click(`#FieldDescription textarea`)
    .wait(1000)
    //イベントの説明文を取得
    .evaluate((selector) => {
      let text = document.querySelector(selector).value;
      document.querySelector(selector).value = ""; //空にする
      return new Promise((resolve, reject) => {
        resolve(text);
      });
    },`#FieldDescription textarea`)
    //テキストの書き換え
    .then((text) => {
      return contentRewrite(text);
    })
}

async function tryWaitFunction () {
  console.log('start!! ログインして情報を取得しています...');
  const eventbody = await getEventBody();
  console.log('->イベント概要&&SS情報取得完了');
  console.log('イベントページを書き換えます...');

  await nightmare
    .evaluate((selector, text) => {
      document.querySelector(selector).value = text; //空にする
      return new Promise((resolve, reject) => {
        resolve(text);
      });
    },`#FieldDescription textarea`, eventbody)
    .click(`#FieldDescription .save`)
    .end();
  console.log('->書き換え完了！');
}
tryWaitFunction();