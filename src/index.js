import { SueComponent } from './core';

new SueComponent({
    el:"root",
    data: () => {
        return {
            article: {
                title: "sue",
            },
            author: "songdonghong"
        };
    },
    watch: {
        author(value) {
            console.log("author:", value);
        }
    },
    methods: {
        onButtonClick() {
            this.author = "songdonghong";
            alert("clicked!");
        }
    },
    created(){
        console.log("created",this);
    },
    mouted(){
        console.log("mouted",this);
    },
    template:
        `
            <div>
                <div style="font-size: 24px;">{{article.title}}: {{author}}</div>
                <div>{{article.title}}</div>
                <div>{{author}}</div>
                <div><input type="text" v-model="article.title"></div>
                <div><input type="text" v-model="author"></div>
                <div><input type="text" v-model="author"></div>
                <div><button @click="onButtonClick">click</button></div>
            </div>
        `
});


