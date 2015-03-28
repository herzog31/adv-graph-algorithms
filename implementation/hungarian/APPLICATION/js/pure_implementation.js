function setAll(arr, val) {
    var i, n = arr.length;
    for (i = 0; i < n; ++i) {
        arr[i] = val;
    }
}

function initLabels(){
    for (var x = 0; x < n; x++) {
        for (var y = 0; y < n; y++) {
            if(cost[x][y] > lx[x]){
                lx[x] = cost[x][y];
            }
        }
    }
}

function augment(){
    if(maxMatch == cost.length) return;
    var x, y, root = -1;
    var q = new Array(n);
    var wr = 0, rd = 0;
    setAll(S, false);
    setAll(T, false);
    setAll(prev, -1);
    for (x = 0; x < n; x++) {
        if (xy[x] == -1) {
            q[wr++] = root = x;
            prev[x] = -2;
            S[x] = true;
            break;
        }
    }

    for (y = 0; y < n; y++) {
        slack[y] = lx[root] + ly[y] - cost[root][y];
        slackx[y] = root;
    }

    while (true){
        while (rd < wr) {
            x = q[rd++];
            for (y = 0; y < n; y++) {
                if (cost[x][y] == lx[x] + ly[y] && !T[y]) {
                    if (yx[y] == -1) break;
                    T[y] = true;
                    q[wr++] = yx[y];
                    add_to_tree(yx[y], x);
                }
            }
            if (y < n) break;
        }
        if (y < n) break;

        update_labels();
        wr = rd = 0;
        for (y = 0; y < n; y++)
            if (!T[y] &&  slack[y] == 0) {
                if (yx[y] == -1) {
                    x = slackx[y];
                    break;
                }else {
                    T[y] = true;
                    if (!S[yx[y]]) {
                        q[wr++] = yx[y];
                        add_to_tree(yx[y], slackx[y]);
                    }
                }
            }
        if (y < n) break;
    }

    if (y < n){
        maxMatch++;
        for (var cx = x, cy = y, ty; cx != -2; cx = prev[cx], cy = ty){
            ty = xy[cx];
            yx[cy] = cx;
            xy[cx] = cy;
        }
        augment();
    }
}

function update_labels(){
    var x, y, delta = -1;
    for (y = 0; y < n; y++) {
        if (!T[y] && (delta == -1 || slack[y] < delta)) {
            delta = slack[y];
        }
    }
    for (x = 0; x < n; x++) {
        if (S[x]) lx[x] -= delta;
    }
    for (y = 0; y < n; y++) {
        if (T[y]) ly[y] += delta;
    }
    for (y = 0; y < n; y++) {
        if (!T[y])
            slack[y] -= delta;
    }
}


function add_to_tree(x, prevx){
    S[x] = true;
    prev[x] = prevx;
    for (var y = 0; y < n; y++) {
        if (lx[x] + ly[y] - cost[x][y] < slack[y]) {
            slack[y] = lx[x] + ly[y] - cost[x][y];
            slackx[y] = x;
        }
    }
}

function hungarianMethod(){
    var ret = 0;
    initLabels();
    augment();
    for (var x = 0; x < n; x++)
    ret += cost[x][xy[x]];
    alert(ret);
    return ret;
}

var cost = [[7,4,3],[6,8,5],[9,4,4]];

var lx = new Array(cost.length),
    ly = new Array(cost.length),
    xy = new Array(cost.length),
    yx = new Array(cost.length),
    S = new Array(cost.length),
    T = new Array(cost.length),
    slack = new Array(cost.length),
    slackx = new Array(cost.length),
    prev = new Array(cost.length),
    maxMatch = 0;
var n = cost.length;
setAll(S, false);
setAll(T, false);
setAll(xy, -1);
setAll(yx, -1);
setAll(lx, 0);
setAll(ly, 0);


hungarianMethod();