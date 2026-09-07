import { SupportedLanguage } from '../types';

export interface DashboardDictionary {
  header: {
    title: string;
    subtitle: string;
    demoMode: string;
    subflow: string;
    liveSync: string;
    eventLocation: string;
    dateTime: string;
  };
  scenarios: {
    label: string;
    s1: string;
    s2: string;
    s3: string;
    s4: string;
    reset: string;
  };
  pravah: {
    title: string;
    subtitle: string;
    liveIncident: string;
    critical: string;
    r17Restriction: string;
    reasonLabel: string;
    reasonValue: string;
    startedLabel: string;
    startedValue: string;
    authorityLabel: string;
    authorityValue: string;
    routeSubtitle: string;
    aiRecTitle: string;
    confidence: string;
    aiRecText: string;
    affectedPilgrims: string;
    viewReasoning: string;
    operatorAction: string;
    awaitingApproval: string;
    approveBroadcast: string;
    overrideRoute: string;
    maintainFlow: string;
    pilgrimImpact: string;
    notified: string;
    volunteers: string;
    facilitiesUpdated: string;
    expectedDelay: string;
    crowdMapTitle: string;
    crowdDensityToggle: string;
    facilitiesToggle: string;
    timelineTitle: string;
    t1: string;
    t2: string;
    t3: string;
    t4: string;
    t5: string;
    t6: string;
    systemBannerTitle: string;
    systemBannerSubtitle: string;
    legendHigh: string;
    legendMed: string;
    legendLow: string;
    legendClosed: string;
    legendRec: string;
    legendParking: string;
    legendToilet: string;
    legendMedical: string;
    legendWater: string;
    legendPolice: string;
    legendVolunteer: string;
  };
  mobile: {
    title: string;
    subtitle: string;
    alertTitle: string;
    alertText: string;
    newRouteTitle: string;
    fromLocation: string;
    toLocation: string;
    walkTime: string;
    startJourney: string;
    nearbyFacilities: string;
    viewAll: string;
    toilet: string;
    water: string;
    medical: string;
    volunteer: string;
    needHelp: string;
    askPlaceholder: string;
    navHome: string;
    navMap: string;
    navAsk: string;
    navMore: string;
  };
}

export const DASHBOARD_TRANSLATIONS: Record<SupportedLanguage, DashboardDictionary> = {
  en: {
    header: {
      title: 'ANUBHAV',
      subtitle: 'AI-Powered Pilgrim Experience',
      demoMode: 'Demo Mode • Live Simulation',
      subflow: 'Pravah Control ➔ Anubhav Mobile ➔ Pilgrim',
      liveSync: 'Live Sync < 500ms',
      eventLocation: 'Kumbh Mela 2026, Nashik',
      dateTime: '11:58 AM • 6 Sep 2026'
    },
    scenarios: {
      label: 'DEMO SCENARIO',
      s1: '01 Normal Flow',
      s2: '02 Peak Crowd',
      s3: '03 VIP Movement',
      s4: '04 Route Closure',
      reset: 'Reset Demo'
    },
    pravah: {
      title: 'PRAVAH',
      subtitle: 'Police Control Command',
      liveIncident: 'LIVE INCIDENT',
      critical: 'CRITICAL',
      r17Restriction: 'R17 Route Restriction',
      reasonLabel: 'Reason',
      reasonValue: 'VIP Movement',
      startedLabel: 'Started',
      startedValue: '11:56 AM',
      authorityLabel: 'Authority',
      authorityValue: 'Police Order',
      routeSubtitle: 'R17 (Ramkund ➔ Triveni Marg)',
      aiRecTitle: 'AI RECOMMENDATION',
      confidence: '94% Confidence',
      aiRecText: 'Redirect pilgrims via R21. R17 is temporarily restricted due to VIP movement.',
      affectedPilgrims: 'Affected Pilgrims: ~ 1,284',
      viewReasoning: 'View AI Reasoning ➔',
      operatorAction: 'OPERATOR ACTION',
      awaitingApproval: 'Awaiting approval',
      approveBroadcast: 'Approve & Broadcast',
      overrideRoute: 'Override Route',
      maintainFlow: 'Maintain Current Flow',
      pilgrimImpact: 'PILGRIM IMPACT (Estimated)',
      notified: 'Notified',
      volunteers: 'Volunteers',
      facilitiesUpdated: 'Facilities Updated',
      expectedDelay: 'Expected Delay',
      crowdMapTitle: 'LIVE CROWD MAP',
      crowdDensityToggle: 'Crowd Density',
      facilitiesToggle: 'Facilities',
      timelineTitle: 'LIVE INCIDENT TIMELINE',
      t1: 'VIP movement detected on R17',
      t2: 'AI predicts congestion (R17)',
      t3: 'Police issues route restriction (R17)',
      t4: 'AI recommends R21 as alternative',
      t5: 'Officer approves & broadcasts',
      t6: 'Notifications sent to 1,284 pilgrims',
      systemBannerTitle: 'AI + Human + System',
      systemBannerSubtitle: 'Working together for a safer Kumbh experience',
      legendHigh: 'High',
      legendMed: 'Medium',
      legendLow: 'Low',
      legendClosed: 'Route Closed',
      legendRec: 'Recommended Route',
      legendParking: 'Parking',
      legendToilet: 'Toilet',
      legendMedical: 'Medical',
      legendWater: 'Water',
      legendPolice: 'Police',
      legendVolunteer: 'Volunteer'
    },
    mobile: {
      title: 'ANUBHAV',
      subtitle: 'Your Pilgrim Guide',
      alertTitle: 'Your route has been updated',
      alertText: 'R17 is temporarily closed due to VIP movement. We have found a safer route for you.',
      newRouteTitle: 'New Route',
      fromLocation: 'Ramkund',
      toLocation: 'R21 (Riverside Road)',
      walkTime: '12 min',
      startJourney: 'Start Journey ➔',
      nearbyFacilities: 'Nearby Facilities',
      viewAll: 'View all ➔',
      toilet: 'Toilet',
      water: 'Water',
      medical: 'Medical',
      volunteer: 'Volunteer',
      needHelp: 'Need Help?',
      askPlaceholder: 'Ask ANUBHAV...',
      navHome: 'Home',
      navMap: 'Map',
      navAsk: 'Ask',
      navMore: 'More'
    }
  },

  hi: {
    header: {
      title: 'अनुभव (ANUBHAV)',
      subtitle: 'एआई-संचालित तीर्थयात्री अनुभव',
      demoMode: 'डेमो मोड • सजीव सिमुलेशन',
      subflow: 'प्रवाह नियंत्रण ➔ अनुभव मोबाइल ➔ तीर्थयात्री',
      liveSync: 'लाइव सिंक < ५०० मिलीसेकंड',
      eventLocation: 'कुंभ मेला २०२६, नाशिक',
      dateTime: '११:५८ AM • ६ सित २०२६'
    },
    scenarios: {
      label: 'डेमो परिदृश्य',
      s1: '०१ सामान्य प्रवाह',
      s2: '०२ अत्यधिक भीड़',
      s3: '०३ वीआईपी मूवमेंट',
      s4: '०४ मार्ग बंदी',
      reset: 'रीसेट करें'
    },
    pravah: {
      title: 'प्रवाह (PRAVAH)',
      subtitle: 'पुलिस नियंत्रण कमान',
      liveIncident: 'सक्रिय घटना',
      critical: 'अति-गंभीर',
      r17Restriction: 'R17 मार्ग प्रतिबंध',
      reasonLabel: 'कारण',
      reasonValue: 'वीआईपी काफिला',
      startedLabel: 'प्रारंभ समय',
      startedValue: '११:५६ AM',
      authorityLabel: 'प्राधिकरण',
      authorityValue: 'पुलिस आदेश',
      routeSubtitle: 'R17 (रामकुंड ➔ त्रिवेणी मार्ग)',
      aiRecTitle: 'एआई अनुशंसा',
      confidence: '९४% सटीकता',
      aiRecText: 'तीर्थयात्रियों को R21 मार्ग से भेजें। वीआईपी काफिले के कारण R17 अस्थायी रूप से बंद है।',
      affectedPilgrims: 'प्रभावित श्रद्धालु: ~ १,२८४',
      viewReasoning: 'एआई तर्क देखें ➔',
      operatorAction: 'ऑपरेटर कार्रवाई',
      awaitingApproval: 'स्वीकृति की प्रतीक्षा',
      approveBroadcast: 'स्वीकृत करें व प्रसारित करें',
      overrideRoute: 'मार्ग ओवरराइड',
      maintainFlow: 'वर्तमान प्रवाह रखें',
      pilgrimImpact: 'तीर्थयात्री प्रभाव (अनुमानित)',
      notified: 'सूचित श्रद्धालु',
      volunteers: 'स्वयंसेवक',
      facilitiesUpdated: 'सुविधाएं अद्यतन',
      expectedDelay: 'अपेक्षित विलंब',
      crowdMapTitle: 'सजीव भीड़ मानचित्र (LIVE CROWD MAP)',
      crowdDensityToggle: 'भीड़ घनत्व',
      facilitiesToggle: 'सुविधाएं',
      timelineTitle: 'घटना समयरेखा (TIMELINE)',
      t1: 'R17 पर वीआईपी आवागमन दर्ज',
      t2: 'एआई ने R17 पर भीड़भाड़ का पूर्वानुमान लगाया',
      t3: 'पुलिस ने मार्ग प्रतिबंध आदेश जारी किया (R17)',
      t4: 'एआई ने R21 को सुरक्षित विकल्प सुझाया',
      t5: 'कमांड अधिकारी ने स्वीकृति देकर प्रसारण किया',
      t6: '१,२८४ तीर्थयात्रियों को त्वरित सूचना भेजी गई',
      systemBannerTitle: 'एआई + मानव + प्रणाली',
      systemBannerSubtitle: 'सुरक्षित एवं सुगम कुंभ अनुभव के लिए संयुक्त कार्य',
      legendHigh: 'उच्च',
      legendMed: 'मध्यम',
      legendLow: 'कम',
      legendClosed: 'मार्ग बंद',
      legendRec: 'अनुशंसित मार्ग',
      legendParking: 'पार्किंग',
      legendToilet: 'शौचालय',
      legendMedical: 'चिकित्सा',
      legendWater: 'जल',
      legendPolice: 'पुलिस',
      legendVolunteer: 'स्वयंसेवक'
    },
    mobile: {
      title: 'अनुभव (ANUBHAV)',
      subtitle: 'आपका तीर्थ मित्र',
      alertTitle: 'आपका मार्ग अद्यतन किया गया है',
      alertText: 'वीआईपी काफिले के कारण R17 अस्थायी रूप से बंद है। हमने आपके लिए सुरक्षित मार्ग चुना है।',
      newRouteTitle: 'नया सुरक्षित मार्ग',
      fromLocation: 'रामकुंड',
      toLocation: 'R21 (रिवरसाइड मार्ग)',
      walkTime: '१२ मिनट',
      startJourney: 'यात्रा प्रारंभ करें ➔',
      nearbyFacilities: 'निकटतम सुविधाएं',
      viewAll: 'सभी देखें ➔',
      toilet: 'शौचालय',
      water: 'शीतल जल',
      medical: 'चिकित्सा',
      volunteer: 'स्वयंसेवक',
      needHelp: 'सहायता चाहिए?',
      askPlaceholder: 'अनुभव से पूछें...',
      navHome: 'होम',
      navMap: 'मानचित्र',
      navAsk: 'पूछें',
      navMore: 'अधिक'
    }
  },

  mr: {
    header: {
      title: 'अनुभव (ANUBHAV)',
      subtitle: 'एआय-सक्षम तीर्थयात्रा अनुभव',
      demoMode: 'डेमो मोड • थेट सिम्युलेशन',
      subflow: 'प्रवाह नियंत्रण ➔ अनुभव मोबाईल ➔ यात्रेकरू',
      liveSync: 'थेट सिंक < ५०० मिलीसेकंद',
      eventLocation: 'कुंभमेळा २०२६, नाशिक',
      dateTime: '११:५८ AM • ६ सप्टें २०२६'
    },
    scenarios: {
      label: 'डेमो परिस्थिती',
      s1: '०१ सामान्य प्रवाह',
      s2: '०२ मोठी गर्दी',
      s3: '०३ व्हीआयपी हालचाल',
      s4: '०४ रस्ता बंदी',
      reset: 'पूर्ववत करा'
    },
    pravah: {
      title: 'प्रवाह (PRAVAH)',
      subtitle: 'पोलीस नियंत्रण कक्ष',
      liveIncident: 'थेट घटना',
      critical: 'अति-गंभीर',
      r17Restriction: 'R17 मार्ग निर्बंध',
      reasonLabel: 'कारण',
      reasonValue: 'व्हीआयपी मिरवणूक',
      startedLabel: 'सुरू वेळ',
      startedValue: '११:५६ AM',
      authorityLabel: 'प्राधिकरण',
      authorityValue: 'पोलीस आदेश',
      routeSubtitle: 'R17 (रामकुंड ➔ त्रिवेणी मार्ग)',
      aiRecTitle: 'एआय शिफारस',
      confidence: '९४% अचूकता',
      aiRecText: 'यात्रेकरूंना R21 मार्गावरून वळवा. व्हीआयपी मिरवणुकीमुळे R17 तात्पुरता बंद आहे.',
      affectedPilgrims: 'प्रभावित भाविक: ~ १,२८४',
      viewReasoning: 'एआय तर्क पहा ➔',
      operatorAction: 'ऑपरेटर कृती',
      awaitingApproval: 'मंजुरीची प्रतीक्षा',
      approveBroadcast: 'मंजूर करा व प्रसारित करा',
      overrideRoute: 'मार्ग बदला',
      maintainFlow: 'सध्याचा प्रवाह ठेवा',
      pilgrimImpact: 'भाविक प्रभाव (अंदाजित)',
      notified: 'सूचित भाविक',
      volunteers: 'स्वयंसेवक',
      facilitiesUpdated: 'सुविधा अद्यतन',
      expectedDelay: 'अपेक्षित विलंब',
      crowdMapTitle: 'थेट गर्दी नकाशा (LIVE CROWD MAP)',
      crowdDensityToggle: 'गर्दी घनता',
      facilitiesToggle: 'नागरी सुविधा',
      timelineTitle: 'घटना कालरेषा (TIMELINE)',
      t1: 'R17 मार्गावर व्हीआयपी हालचाल नोंदवली',
      t2: 'एआय कडून R17 वर गर्दीचा इशारा',
      t3: 'पोलीस आदेशानुसार R17 मार्ग बंद',
      t4: 'एआय कडून R21 पर्यायी सुरक्षित मार्ग शिफारस',
      t5: 'कमांड अधिकाऱ्यांकडून मंजुरी व प्रसारण',
      t6: '१,२८४ यात्रेकरूंना थेट सूचना पाठवली',
      systemBannerTitle: 'एआय + मानव + यंत्रणा',
      systemBannerSubtitle: 'सुरक्षित कुंभ अनुभवासाठी एकत्रित कार्य',
      legendHigh: 'जास्त',
      legendMed: 'मध्यम',
      legendLow: 'कमी',
      legendClosed: 'मार्ग बंद',
      legendRec: 'शिफारस केलेला मार्ग',
      legendParking: 'पार्किंग',
      legendToilet: 'शौचालय',
      legendMedical: 'वैद्यकीय',
      legendWater: 'पाणी',
      legendPolice: 'पोलीस',
      legendVolunteer: 'स्वयंसेवक'
    },
    mobile: {
      title: 'अनुभव (ANUBHAV)',
      subtitle: 'आपला तीर्थमित्र',
      alertTitle: 'आपला मार्ग अद्यतनित करण्यात आला आहे',
      alertText: 'व्हीआयपी हालचालीमुळे R17 तात्पुरता बंद आहे. आम्ही आपल्यासाठी अधिक सुरक्षित मार्ग निवडला आहे.',
      newRouteTitle: 'नवीन सुरक्षित मार्ग',
      fromLocation: 'रामकुंड',
      toLocation: 'R21 (रिवरसाइड मार्ग)',
      walkTime: '१२ मिनिटे',
      startJourney: 'प्रवास सुरू करा ➔',
      nearbyFacilities: 'जवळच्या नागरी सुविधा',
      viewAll: 'सर्व पहा ➔',
      toilet: 'शौचालय',
      water: 'शीतल जल',
      medical: 'वैद्यकीय कक्ष',
      volunteer: 'स्वयंसेवक',
      needHelp: 'मदत हवी आहे?',
      askPlaceholder: 'अनुभवला विचारा...',
      navHome: 'होम',
      navMap: 'नकाशा',
      navAsk: 'विचारा',
      navMore: 'अधिक'
    }
  }
};
