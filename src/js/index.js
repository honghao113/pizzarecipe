import Search from "./models/Search";
import Recipe from "./models/Recipe";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView"
import * as likesView from "./views/likesView"
import Likes from './models/Likes';
import { elements, renderLoader, clearLoader } from "./views/base";
import List from "./models/List";
/** Global state of the app
 * - Search object
 * -current recipe object
 * - Liked recipes
 */

const state = {};


/**
 * Search controller
 */
const controlSearch = async () => {
  //1 get query from view
  const query = searchView.getInput();
  //const query = 'pizza';

  if (query) {
    //2(new search object and add to state)
    state.search = new Search(query);

    //3 (Prepare UI for results)
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    // 4 search for recipes
    await state.search.getResults();
    clearLoader();
    // //5 render results on UI
    searchView.renderResults(state.search.result);
  }
};
elements.searchFrom.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

// window.addEventListener('submit', e => {
//   e.preventDefault();
//   controlSearch();
// })

elements.searchResPages.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**
 * recipe controller
 */
const controlRecipe = async () => {
  const id = window.location.hash.replace("#", "");




  //highlight selected search item
  if (state.search) {
    searchView.highlightSelected(id);
  }
  if (id) {
    recipeView.clearRecipe();
    // preopare ui for changes
    renderLoader(elements.recipe);
    //reate new recipe object
    state.recipe = new Recipe(id);
    //window.r = state.recipe;
    try {
      //Get recipe data
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      //calculate serving and time

      state.recipe.calcTime();
      state.recipe.calcServing();

      clearLoader();
      recipeView.rednderRecipe(state.recipe,state.likes.isLiked(id));
    } catch (err) {
      alert("Error precessing recipe!");
    }
  }
};
// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);


/**
 * lst controller
 */
const controlList = () =>{
  //create a new list if there is none yet
  if(!state.list){
    state.list = new List();
  }

  // add each ingredient to the list
  state.recipe.ingredients.forEach(el=>{
    const item = state.list.additem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  })
}

//handle delete and update list itme event
elements.shopping.addEventListener('click',e=>{
  const id = e.target.closest('.shopping__item').dataset.itemid;

  //handle the delete button

  if(e.target.matches('.shopping__delete, .shopping__delete *')){
    state.list.deleteItem(id);

    listView.deleItem(id);
  }

  //handle the count update
  else if (e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
}
})


//Like controller
state.likes = new Likes();
const controlLike = ()=>{
  if(!state.likes){
    state.likes = new Likes();
    
  }
  const currentID =state.recipe.id;

  
  if(!state.likes.isLiked(currentID)){
    //add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    )
    
    // toggle the like button
    likesView.toggleLikeBtn(true);
    //add like to ui list
    likesView.renderLike(newLike);
    //user has not yet liked current recipe
  }
  else {
    // remove like from the state
    state.likes.deleteLike(currentID);
    likesView.toggleLikeBtn(false);
    //toggle the like button
    // remove like form ui list
    likesView.deleteLike(currentID);
    
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes())
}
//restore liked recipes on page load

window.addEventListener('load', () =>{
  state.likes = new Likes();
  state.likes.readStorage();
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  state.likes.likes.forEach(like => likesView.renderLike(like));
}
)
//handling recipe button clicks
elements.recipe.addEventListener("click", (e) => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    //Decrease button is clieck\
    if (state.recipe.servings > 1) {
      state.recipe.updateServing("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    state.recipe.updateServing("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if(e.target.matches(".recipe_btn--add, .recipe__btn--add *")){
    controlList();
  }
    else if(e.target.matches('.recipe__love, .recipe__love *')){
      // Like controller
      controlLike();
    }
});

