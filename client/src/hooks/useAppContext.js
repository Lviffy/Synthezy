import { useContext } from 'react';
import { AppContext } from '../provider/AppStates';

export const useAppContext = () => {
  return useContext(AppContext);
};
