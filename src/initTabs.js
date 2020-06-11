import { MDCTabBar } from '@material/tab-bar';

const initTabs = () => {
  const tabBar = new MDCTabBar(document.querySelector('.mdc-tab-bar'));
  const contentEls = document.querySelectorAll('.content');

  tabBar.listen('MDCTabBar:activated', function(event) {
    document.querySelector('.content--active').classList.remove('content--active');

    contentEls[event.detail.index].classList.add('content--active');
  })
}

export default initTabs;