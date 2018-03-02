class Cube3 {
    constructor() {
        this.dset = null;
        this.dims = [];
        this.aggs = [];
        this.rels = [];
        this.rollups = [];
    }

    dim(fx, table, name, compare = Cube3.DEF.defComp) {
        name = (name || ++Cube3.CONV.dimName);
        Cube3.CONV.insertDistinct(this.dims, x => x.name === name, {
            fx,
            table,
            name,
            compare
        });
        return this;
    }

    agg(fx, table, name) {
        name = (name || ++Cube3.CONV.dimName);
        Cube3.CONV.insertDistinct(this.aggs, x => x.name === name, {
            fx,
            table,
            name
        });
        return this;
    }

    rollup(fx, name) {
        name = (name || ++Cube3.CONV.dimName);
        Cube3.CONV.insertDistinct(this.rollups, x => x.name === name, {
            fx,
            name
        });
        return this;
    }

    rel(fx, t1, t2) {
        this.rels.push({
            fx,
            t1,
            t2
        });
        return this;
    }

    data(dset) {
        this.dset = dset;
        return this;
    }

    getDims(dims) {
        const tnames = Object.keys(this.dset);
        const {
            dset
        } = this;
        const dlen = tnames.reduce((a, b) => Math.max(a, dset[b].length), 0);
        const fdims = this.dims.filter(d => dims.indexOf(d.name) >= 0);

        const result = {};

        Cube3.oneLoop([dlen, tnames.length, fdims.length], (idx) => {
            const [i, ni, di] = idx;
            const tname = tnames[ni]
            const tab = dset[tname];
            if (i < tab.length) {

                const d = tab[i];
                const dim = fdims[di];
                if (tname === dim.table) {

                    const facts = result[dim.name] || (result[dim.name] = [])
                    const fact = dim.fx(d);
                    Cube3.CONV.insertDistinct(facts, x => dim.compare(x, fact) === 0, fact);
                }
            }
        })
        return result
    }

    getMeasure(measures, filter = {}) {

        const {
            dims,
            aggs,
            rollups,
            rels,
            dset
        } = this;
        const results = {};
        const tnames = [];
        const alltnames = Object.keys(dset);
        const laggs = {};
        aggs.forEach(a => {
            measures.indexOf(a.name) && (laggs[a.name] = a);

            tnames.indexOf(a.table) < 0 &&
                alltnames.indexOf(a.table) >= 0 &&
                measures.indexOf(a.name) >= 0 &&
                tnames.push(a.table)
        })

        dims.forEach(d => {

            tnames.indexOf(d.table) < 0 &&
                alltnames.indexOf(d.table) >= 0 &&
                filter.hasOwnProperty(d.name) &&
                tnames.push(d.table)
        })

        rels.forEach(r => {
            if (alltnames.indexOf(r.t1) >= 0 && alltnames.indexOf(r.t2) >= 0) //valid
            {
                if (tnames.indexOf(r.t1) >= 0) {
                    Cube3.CONV.insertDistinct(tnames, (a) => a === r.t2, r.t2);
                } else
                if (tnames.indexOf(r.t2) >= 0)
                    Cube3.CONV.insertDistinct(tnames, (a) => a === r.t1, r.t1);
            }
        })

        const froll = {}
        const gra = Cube3.gra(tnames.map(t => dset[t].length));
        const total = gra.reduce((a, b) => {
            return a * b
        }, 1);
        let pos = [];
        const ameasures = Object.keys(laggs)
        rollups.forEach(r => ameasures.indexOf(r.name) >= 0 && (froll[r.name] = r));

        Cube3.oneLoop([total, ameasures.length], ([i, mi]) => {
            mi === 0 && (pos = Cube3.disect(i, gra))

            const a = laggs[ameasures[mi]];
            const t = dset[a.table];
            const di = pos[tnames.indexOf(a.table)];
            const m = a.fx(t[di]);

            //Should we roll this?

            //Get all relationship related to this agg
            const prels = [];
            rels.forEach(r => {
                r.t1 === a.table || r.t2 === a.table
            })

            let yes = true;

            if (yes) {
                const roll = froll[a.name];
                results[roll.name] = roll.fx(results[roll.name], m)
            }



        })
    }

}

Cube3.oneLoop = function (Lens, fx) {
    var DimLen = Lens.length;
    var Total = DimLen;
    var Granula = [];
    var Idx = [];
    var i = 0,
        r, c;
    var k = 1;
    var inc;

    Lens.forEach(function (l, s) {
        Granula.push(k);
        k *= Lens[DimLen - (s + 1)];
        Idx.push(l);
        Total *= l;
    })
    Granula.reverse();
    while (i < Total) {
        r = Math.floor(i / DimLen);
        c = i % DimLen;
        c == 0 ? k = r : 0;
        Idx[c] = Math.floor(k / Granula[c]);
        k = k % Granula[c];
        (c == DimLen - 1) ? (
            inc = fx(Idx, r, Granula),
            i += (inc ? (inc - 1) * DimLen : 0)
        ) : 0;
        i++;

    }
}

Cube3.gra = function (dims) {
    const g = [];
    let x = 1;
    dims.forEach((l, i) => {
        g.push(x);
        x *= dims[dims.length - (i + 1)]
    })
    return g.reverse();
}

Cube3.dimmap = function (v, gra) {
    let r = 0;
    v.forEach((x, i) => {
        r += x * gra[i]
    })
    return r;
}


Cube3.disect = function (x, gra) {
    const dv = [];
    while (i++ < gra.length) {
        dv.push(Math.floor(x / gra[i]))
        x = x % gra[i];
    }
    return dv;
}

Cube3.CONV = {
    dimName: 0,
    insertDistinct: function (array, findfx, d) {
        !array.find(findfx) &&
            array.push(d);
    }
}

Cube3.DEF = {
    defAgg: (d) => {},
    defComp: (a, b) => a === b ? 0 : (a > b ? -1 : 1)
}

module.exports = Cube3;