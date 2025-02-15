# <img src="./.git-assets/img/logo.png" style="border: 1px solid Gainsboro; width: 25px;"> Horizon.md (Alpha)

Horizon.md is a browser extension and a future web platform that lets you highlight and note any text or youtube video on the internet.

## Alpha (?)

This is the Alpha release of Horizon, pre-platform. Follow the progress on [x.com/@kuberdenis](x.com/@kuberdenis), which is my personal profile. I will soon create an official account.

## Prerequisites

On my machine it works . . . with:

- nodejs v23.1.0
- npm v10.9.0
- chrome v132.0.6834.160

## Installation

Install the required libraries for webpack and build.

```
npm install
npm run build
```
<!-- 
<div style="display: grid; grid-template-columns: auto auto; grid-gap: 30px 30px;">
    <div>
        <p style="padding-bottom: 10px;">I. Open Chrome -> Extensions -> Toggle `Developer Mode`:</p>
        <img src="./.git-assets/img/1.png" style="border: 2px solid Gainsboro; border-radius: 10px;">
    </div>
    <div>
        <p style="padding-bottom: 10px;">II. Click `Load Unpacked` -> Select The Directory</p>
        <img src="./.git-assets/img/2.png" style="border: 2px solid Gainsboro; border-radius: 10px;">
    </div>
</div> -->

<table>
  <tr>
    <td>
        <p style="padding-bottom: 10px;">I. Open Chrome -> Extensions -> Toggle `Developer Mode`:</p>
        <img src="./.git-assets/img/1.png" style="border: 2px solid Gainsboro; border-radius: 10px;">
    </td>
    <td>
        <p style="padding-bottom: 10px;">II. Click `Load Unpacked` -> Select The Directory</p>
        <img src="./.git-assets/img/2.png" style="border: 2px solid Gainsboro; border-radius: 10px;">
    </td>
   </tr> 
  </tr>
</table>

## Usage Guide

Below is the usage guide controls table.

| Feature      | Description | Usage |
| ----------- | ----------- | ----------- |
| Highlight      | Highlight Text       | Select Text → Right Click → Horizon Sub-Menu → Add Highlight        |
| Note   | Add Notes To Highlights        | Open Sidebar → Pick Highlight → Click Add Note → `CMD / CTRL + Enter` to save        |
| Video Highlight      | Save Video Time Range       | Press `[` To Start → Press `]` To Finish → Click `Save`        |
| Scroll To Highlight      | Automatically open a page and scroll to text highlight       | Pick Highlight → Click on the `URL`         |
| Open Video At A Time      | Automatically open a saved video at the time range saved       | Pick Highlight → Click on the `URL`         |