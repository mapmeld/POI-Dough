# HEROKU Node Canvas


A simple fork just to get this guy working on heroku.

- Includes precompiled cairo modules in ./cairo
- Has a modified wscript in order to reference that precompiled cairo stuff

- Loses JPEG and GIF support ... as I couldn't figure those out and I didn't need them.

## usage:

### 1. create a heroku app in cedar:

`heroku create --stack cedar`

### 2. set environment variables

create a `.env` file in your application with this contents:

```bash
LD_PRELOAD='/app/node_modules/canvas/cairo/libcairo.so /app/node_modules/canvas/lib/libpixman-1.so.0 /app/node_modules/canvas/lib/libfreetype.so.6'
LD_LIBRARY_PATH=/app/node_modules/canvas/cairo
```
* `LD_PRELOAD` will tell heroku to always preload those libs
* `LD_LIBRARY_PATH` will tell heroku where to find aditional dinamic libs

