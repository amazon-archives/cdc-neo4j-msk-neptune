// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const fs = require("fs");

const fileToJson = (path, text) => {
  try {
    const data = fs.readFileSync(path, text);
    return JSON.parse(data);
  } catch (e) {
    console.log(e, path, text);
  }
};

const readAll = (path, text) => {
  try {
    const data = fs.readFileSync(path, text);
    return data;
  } catch (e) {
    console.log(e, path, text);
  }
};

module.exports = { fileToJson, readAll };
