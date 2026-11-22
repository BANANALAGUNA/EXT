import { _b } from '../utils.js';

export const userStorageKey = 'sync.user-info';
const userConfigStorageKey = 'sync.user-config';
const DIALS_TRASH_KEY = 'fvd.dials_trash';
const GROUPS_TRASH_KEY = 'fvd.groups_trash';
export const userStorageConfigs = {
	enableSearch: `${userConfigStorageKey}__search-enable`,
};

class UserInfoSync {
	fvdSpeedDial = null;
	userInfo = null;
	isSearchEnable = true;
	fvdSynchronizerName = 'EverSync';
	fvdSynchronizerIds = [
		// Chrome Webstore EverSync ID
		'iohcojnlgnfbmjfjfkbhahhmppcggdog',
		// Opera addons EverSync ID
		'ffhogmjbkahkkpjpjmeppoegnjhpopmc',
	];

	constructor(fvdSpeedDial) {
		this.init(fvdSpeedDial);
	}

	init(fvdSpeedDial) {
		this.fvdSpeedDial = fvdSpeedDial;
		const { localStorage } = fvdSpeedDial;

		const that = this;

		chrome.management.getAll(function (results) {
			results.forEach(function (extension) {
				if (
					extension.enabled
					&& (extension.name.includes(that.fvdSynchronizerName) || that.fvdSynchronizerIds.indexOf(extension.id) >= 0)
				) {
					// userInfo init from storage
					const storageUserInfo = localStorage.getItem(userStorageKey);
					that.setUserInfo(storageUserInfo || null);

					// userConfig init from storage
					that.updateUserConfigs(storageUserInfo);
				}
			});
		});
	}

	updateUserConfigs(userInfo) {
		const { localStorage, Prefs } = this.fvdSpeedDial;
		const userId = userInfo?.user?.user_id;

		if (!userId || userInfo?.state !== 'logged-in') {
			this.isSearchEnable = _b(Prefs.get('sd.enable_search'));
			return;
		}

		let storageEnableSearchValues = localStorage.getItem(userStorageConfigs.enableSearch);

		if (typeof storageEnableSearchValues !== 'object' || storageEnableSearchValues === null) {
			storageEnableSearchValues = {};
		}

		const defaultSearchEnableValue = _b(Prefs.get('sd.enable_search'));

		if (Object.prototype.hasOwnProperty.call(storageEnableSearchValues, userId)) {
			this.isSearchEnable = _b(storageEnableSearchValues[userId]);
		} else {
			this.isSearchEnable = defaultSearchEnableValue;
			storageEnableSearchValues[userId] = defaultSearchEnableValue;
			localStorage.setItem(userStorageConfigs.enableSearch, storageEnableSearchValues);
		}
		/* __FVD_SEARCH_USERSET_GUARD_V1 */
		if (_b(Prefs.get('sd.enable_search_user_set'))) {
			this.isSearchEnable = _b(Prefs.get('sd.enable_search'));
			storageEnableSearchValues[userId] = this.isSearchEnable;
			localStorage.setItem(userStorageConfigs.enableSearch, storageEnableSearchValues);
		} else {
			Prefs.set('sd.enable_search', this.isSearchEnable);
		}
	}

	getUserInfo() {
		return this.userInfo;
	}

	getIsUserActive() {
		return !!this.userInfo && this.userInfo.state === 'logged-in';
	}

	getIsPremiumUser() {
		if (!this.userInfo) {
			return false;
		}

		return this.getIsUserActive() && !!this.userInfo?.user?.premium?.active;
	}

	getIsSearchEnable() {
		if (!this.getIsUserActive()) {
			return _b(this.fvdSpeedDial.Prefs.get('sd.enable_search'));
		}

		return _b(this.isSearchEnable);
	}

	setUserInfo(info, isLogout = false) {
		if ((!info || !info?.auth) && isLogout) {
			this.userInfo = null;
			this.fvdSpeedDial.localStorage.setItem(userStorageKey, null);
			return;
		}

		if (this.userInfo && info === null) {
			return;
		}

		const newUserInfo = {
			...info,
			state: info?.state || 'logged-in',
		};

		this.updateUserConfigs(newUserInfo);

		this.userInfo = newUserInfo;
		this.fvdSpeedDial.localStorage.setItem(userStorageKey, newUserInfo);
	}

	setIsSearchEnable(isSearchEnable) {
		this.isSearchEnable = _b(isSearchEnable);
		this.fvdSpeedDial.Prefs.set('sd.enable_search', this.isSearchEnable);

		if (!this.getIsUserActive() || !this.userInfo?.user?.user_id) {
			return;
		}

		const storageValues = this.fvdSpeedDial.localStorage.getItem(userStorageConfigs.enableSearch);
		const nextStorageValues =
			typeof storageValues === 'object' && storageValues !== null ? storageValues : {};

		nextStorageValues[this.userInfo.user.user_id] = this.isSearchEnable;
		this.fvdSpeedDial.localStorage.setItem(userStorageConfigs.enableSearch, nextStorageValues);
	}

	triggerOnLogin(userInfo) {
		if (!userInfo?.user) {
			return;
		}

		const { Prefs, UpdateDialsModule } = this.fvdSpeedDial;

		this.setUserInfo(userInfo);

		const userID = userInfo?.user?.user_id;
		const dialsTrash = Prefs.get(DIALS_TRASH_KEY, {});
		const groupsTrash = Prefs.get(GROUPS_TRASH_KEY, {});

		if (userID && !dialsTrash[userID] && dialsTrash['undefined']) {
			const updatedTrash = {
				...dialsTrash,
				[userID]: dialsTrash['undefined'] || [],
			};

			Prefs.set(DIALS_TRASH_KEY, updatedTrash);
		}

		if (userID && !groupsTrash[userID] && groupsTrash['undefined']) {
			const updatedTrash = {
				...groupsTrash,
				[userID]: groupsTrash['undefined'] || [],
			};

			Prefs.set(GROUPS_TRASH_KEY, updatedTrash);
		}

		Prefs.set('sd.enable_search', this.isSearchEnable);

		UpdateDialsModule.update();

		chrome.runtime.sendMessage({
			action: 'user:login',
		});
	}

	triggerOnLogout() {
		this.isSearchEnable = _b(this.fvdSpeedDial.Prefs.get('sd.enable_search'));
		
		this.fvdSpeedDial.localStorage.removeItem(userStorageKey);
		this.setUserInfo(null, true);
		this.fvdSpeedDial.Prefs.set('sd.enable_search', this.isSearchEnable);
		this.fvdSpeedDial.UpdateDialsModule.update();

		chrome.runtime.sendMessage({
			action: 'user:logout',
		});
	}
}

export default UserInfoSync;
