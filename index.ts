import './global.css';
import { registerRootComponent } from 'expo';
import App from './src/App';
import { widgetModule } from './src/lib/widget';

// Registered at the entry point because Android runs the widget task without mounting App.
widgetModule()?.registerWidget();

registerRootComponent(App);
